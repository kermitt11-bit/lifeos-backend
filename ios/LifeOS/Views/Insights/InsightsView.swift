import SwiftUI
import SwiftData
import Charts

struct InsightsView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \MoodEntry.date, order: .reverse) private var moods: [MoodEntry]
    @Query(sort: \JournalEntry.date, order: .reverse) private var entries: [JournalEntry]
    @Query private var tasks: [PlannerTask]
    @Query private var habits: [Habit]
    @Query private var goals: [Goal]

    @State private var range: Range = .month

    enum Range: String, CaseIterable, Identifiable {
        case week = "7d", month = "30d", quarter = "90d"
        var id: String { rawValue }
        var days: Int {
            switch self { case .week: return 7; case .month: return 30; case .quarter: return 90 }
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Picker("Range", selection: $range) {
                        ForEach(Range.allCases) { Text($0.rawValue).tag($0) }
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal)

                    summaryGrid

                    moodChart
                    taskCompletionChart
                    categoryBreakdownChart
                    habitConsistencyCard
                    goalsProgressCard
                    NavigationLink {
                        SettingsView()
                    } label: {
                        Label("Settings & data", systemImage: "gearshape.fill")
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Theme.surface)
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal)
                }
                .padding(.vertical, 8)
            }
            .background(Theme.canvas.ignoresSafeArea())
            .navigationTitle("Insights")
        }
    }

    private var summaryGrid: some View {
        let cutoff = Calendar.current.date(byAdding: .day, value: -range.days, to: .now) ?? .now
        let moodInRange = moods.filter { $0.date >= cutoff }
        let avg = moodInRange.isEmpty ? 0 : Double(moodInRange.map { $0.score }.reduce(0, +)) / Double(moodInRange.count)
        let entriesInRange = entries.filter { $0.date >= cutoff }
        let tasksInRange = tasks.filter { $0.dueDate >= cutoff }
        let completedTasks = tasksInRange.filter { $0.isCompleted }.count
        let completionRate = tasksInRange.isEmpty ? 0 : Int(Double(completedTasks) / Double(tasksInRange.count) * 100)
        return LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            StatTile(value: String(format: "%.1f", avg), label: "Avg mood", symbol: "face.smiling.fill", tint: Theme.warning)
            StatTile(value: "\(completionRate)%", label: "Task completion", symbol: "checkmark.circle.fill", tint: Theme.success)
            StatTile(value: "\(entriesInRange.count)", label: "Journal entries", symbol: "book.closed.fill", tint: Theme.info)
            StatTile(value: "\(habits.filter { !$0.isArchived }.count)", label: "Active habits", symbol: "checkmark.seal.fill", tint: Theme.accent)
        }
        .padding(.horizontal)
    }

    private var moodChart: some View {
        let cutoff = Calendar.current.date(byAdding: .day, value: -range.days, to: .now) ?? .now
        let series = moods.filter { $0.date >= cutoff }.sorted { $0.date < $1.date }
        return VStack(alignment: .leading, spacing: 8) {
            SectionHeader(title: "Mood trend", subtitle: "Last \(range.days) days")
            if series.isEmpty {
                Text("Log a mood to start seeing your trend.")
                    .font(.subheadline).foregroundStyle(.secondary).padding(.vertical, 12)
                    .frame(maxWidth: .infinity).card()
            } else {
                Chart(series) { m in
                    LineMark(x: .value("Date", m.date), y: .value("Score", m.score))
                        .interpolationMethod(.catmullRom)
                        .foregroundStyle(Theme.accent)
                    AreaMark(x: .value("Date", m.date), y: .value("Score", m.score))
                        .interpolationMethod(.catmullRom)
                        .foregroundStyle(LinearGradient(colors: [Theme.accent.opacity(0.4), .clear], startPoint: .top, endPoint: .bottom))
                }
                .chartYScale(domain: 0...10)
                .frame(height: 180)
                .card()
            }
        }
        .padding(.horizontal)
    }

    private var taskCompletionChart: some View {
        let cal = Calendar.current
        let cutoff = cal.date(byAdding: .day, value: -range.days, to: .now) ?? .now
        let buckets: [(Date, Int, Int)] = (0..<range.days).reversed().compactMap { offset in
            guard let day = cal.date(byAdding: .day, value: -offset, to: cal.startOfDay(for: .now)) else { return nil }
            let dayTasks = tasks.filter { cal.isDate($0.dueDate, inSameDayAs: day) }
            return (day, dayTasks.count, dayTasks.filter { $0.isCompleted }.count)
        }.filter { $0.0 >= cutoff }

        return VStack(alignment: .leading, spacing: 8) {
            SectionHeader(title: "Task completion", subtitle: "Daily")
            if buckets.allSatisfy({ $0.1 == 0 }) {
                Text("Add tasks to track completion.")
                    .font(.subheadline).foregroundStyle(.secondary).padding(.vertical, 12)
                    .frame(maxWidth: .infinity).card()
            } else {
                Chart(buckets, id: \.0) { item in
                    BarMark(x: .value("Day", item.0, unit: .day), y: .value("Done", item.2))
                        .foregroundStyle(Theme.success)
                    BarMark(x: .value("Day", item.0, unit: .day), y: .value("Open", item.1 - item.2))
                        .foregroundStyle(Theme.success.opacity(0.25))
                }
                .frame(height: 180)
                .card()
            }
        }
        .padding(.horizontal)
    }

    private var categoryBreakdownChart: some View {
        let counts = Dictionary(grouping: tasks, by: { $0.category })
            .map { ($0.key, $0.value.count) }
            .sorted { $0.1 > $1.1 }
        return VStack(alignment: .leading, spacing: 8) {
            SectionHeader(title: "Time by category")
            if counts.isEmpty {
                Text("Categorize your tasks to see this view.")
                    .font(.subheadline).foregroundStyle(.secondary).padding(.vertical, 12)
                    .frame(maxWidth: .infinity).card()
            } else {
                Chart(counts, id: \.0) { (cat, n) in
                    BarMark(x: .value("Count", n), y: .value("Category", cat.label))
                        .foregroundStyle(Theme.categoryColors[cat.rawValue] ?? Theme.accent)
                }
                .frame(height: CGFloat(counts.count * 28 + 40))
                .card()
            }
        }
        .padding(.horizontal)
    }

    private var habitConsistencyCard: some View {
        let active = habits.filter { !$0.isArchived }
        return VStack(alignment: .leading, spacing: 8) {
            SectionHeader(title: "Habit consistency")
            if active.isEmpty {
                Text("Add a habit to track consistency.")
                    .font(.subheadline).foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity).padding(.vertical, 12).card()
            } else {
                VStack(spacing: 10) {
                    ForEach(active) { habit in
                        let pct = habit.targetPerWeek == 0 ? 0 : Double(habit.completionsThisWeek()) / Double(habit.targetPerWeek)
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Label(habit.name, systemImage: habit.symbol)
                                    .foregroundStyle(Color(hex: habit.colorHex))
                                Spacer()
                                Text("\(habit.completionsThisWeek())/\(habit.targetPerWeek)")
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(.secondary)
                            }
                            ProgressView(value: min(pct, 1))
                                .tint(Color(hex: habit.colorHex))
                        }
                    }
                }
                .card()
            }
        }
        .padding(.horizontal)
    }

    private var goalsProgressCard: some View {
        let active = goals.filter { !$0.isCompleted }
        return VStack(alignment: .leading, spacing: 8) {
            SectionHeader(title: "Goal progress")
            if active.isEmpty {
                Text("Set a goal to see your progress.")
                    .font(.subheadline).foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity).padding(.vertical, 12).card()
            } else {
                VStack(spacing: 10) {
                    ForEach(active) { goal in
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Label(goal.title, systemImage: goal.area.symbol)
                                Spacer()
                                Text("\(Int(goal.progress * 100))%").font(.caption.weight(.semibold))
                            }
                            ProgressView(value: goal.progress).tint(Theme.accent)
                        }
                    }
                }
                .card()
            }
        }
        .padding(.horizontal)
    }
}

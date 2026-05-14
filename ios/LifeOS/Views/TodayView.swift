import SwiftUI
import SwiftData

struct TodayView: View {
    @EnvironmentObject var app: AppState
    @Environment(\.modelContext) private var context

    @Query private var allTasks: [PlannerTask]
    @Query private var habits: [Habit]
    @Query(sort: \JournalEntry.date, order: .reverse) private var journalEntries: [JournalEntry]
    @Query(sort: \MoodEntry.date, order: .reverse) private var moods: [MoodEntry]

    @State private var showingAddTask = false
    @State private var showingNewJournal = false
    @State private var showingMoodCheckin = false

    private var todayTasks: [PlannerTask] {
        let cal = Calendar.current
        return allTasks
            .filter { cal.isDate($0.dueDate, inSameDayAs: .now) }
            .sorted {
                if $0.isCompleted != $1.isCompleted { return !$0.isCompleted }
                return $0.priority.rawValue > $1.priority.rawValue
            }
    }

    private var overdue: [PlannerTask] {
        allTasks.filter { $0.isOverdue }.sorted { $0.dueDate < $1.dueDate }
    }

    private var todayJournal: JournalEntry? {
        journalEntries.first { Calendar.current.isDateInToday($0.date) }
    }

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: .now)
        let base: String
        switch hour {
        case 5..<12: base = "Good morning"
        case 12..<17: base = "Good afternoon"
        case 17..<22: base = "Good evening"
        default: base = "Hello"
        }
        let name = app.userName.trimmingCharacters(in: .whitespaces)
        return name.isEmpty ? base : "\(base), \(name)"
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    header
                    quickActions
                    moodCard
                    todayTasksCard
                    if !overdue.isEmpty { overdueCard }
                    journalPromptCard
                    habitsRow
                }
                .padding(.horizontal)
                .padding(.bottom, 24)
            }
            .background(Theme.canvas.ignoresSafeArea())
            .navigationTitle("Today")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showingAddTask) { AddTaskSheet(defaultDate: .now) }
            .sheet(isPresented: $showingNewJournal) { NewJournalEntryView() }
            .sheet(isPresented: $showingMoodCheckin) { MoodCheckinSheet() }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(Date.now.formatted(.dateTime.weekday(.wide).month().day()))
                .font(.subheadline.weight(.medium))
                .foregroundStyle(Theme.accent)
            Text(greeting).font(.largeTitle.weight(.bold))
            if let journal = todayJournal {
                Text("You journaled today \(journal.moodEmoji)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            } else {
                Text("Make today count.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 8)
    }

    private var quickActions: some View {
        HStack(spacing: 12) {
            quickAction("Add Task", "plus.circle.fill", Theme.accent) { showingAddTask = true }
            quickAction("Journal", "book.closed.fill", Theme.info) { showingNewJournal = true }
            quickAction("Mood", "face.smiling.fill", Theme.warning) { showingMoodCheckin = true }
        }
    }

    private func quickAction(_ title: String, _ symbol: String, _ color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: symbol).font(.title2)
                Text(title).font(.caption.weight(.semibold))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(color.opacity(0.12))
            .foregroundStyle(color)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
    }

    private var moodCard: some View {
        let latest = moods.first
        let today = latest.map { Calendar.current.isDateInToday($0.date) } ?? false
        return Button { showingMoodCheckin = true } label: {
            HStack(spacing: 14) {
                Text(latest?.emoji ?? "🌤")
                    .font(.system(size: 38))
                VStack(alignment: .leading, spacing: 4) {
                    Text(today ? "Today's mood logged" : "How are you feeling?")
                        .font(.headline)
                    Text(today
                         ? "Mood \(latest?.score ?? 0)/10 · Energy \(latest?.energy ?? 0)/10"
                         : "Tap to log a quick mood check-in")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(.tertiary)
            }
            .card()
        }
        .buttonStyle(.plain)
    }

    private var todayTasksCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(
                title: "Today's tasks",
                subtitle: "\(todayTasks.filter { $0.isCompleted }.count)/\(todayTasks.count) completed"
            )
            if todayTasks.isEmpty {
                EmptyStateView(
                    symbol: "checklist",
                    title: "No tasks for today",
                    message: "Add your first task to get rolling.",
                    actionLabel: "Add task",
                    action: { showingAddTask = true }
                )
                .card()
            } else {
                VStack(spacing: 8) {
                    ForEach(todayTasks.prefix(6)) { task in
                        TaskRow(task: task)
                    }
                }
            }
        }
    }

    private var overdueCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Overdue", subtitle: "\(overdue.count) to reschedule")
            VStack(spacing: 8) {
                ForEach(overdue.prefix(3)) { task in
                    TaskRow(task: task)
                }
            }
        }
    }

    private var journalPromptCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "sparkles").foregroundStyle(Theme.accent)
                Text("Reflection prompt").font(.subheadline.weight(.semibold))
                Spacer()
            }
            Text(JournalPrompts.daily.randomElement() ?? "What made today meaningful?")
                .font(.title3.weight(.medium))
            Button { showingNewJournal = true } label: {
                HStack {
                    Text(todayJournal == nil ? "Write today's entry" : "Open today's entry")
                    Image(systemName: "arrow.right")
                }
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Theme.accent)
            }
        }
        .card()
    }

    private var habitsRow: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Habits", subtitle: "Tap to mark complete")
            if habits.isEmpty {
                EmptyStateView(
                    symbol: "checkmark.seal",
                    title: "No habits yet",
                    message: "Build the routines that move your life forward.",
                    actionLabel: nil,
                    action: nil
                ).card()
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(habits.filter { !$0.isArchived }) { habit in
                            HabitChip(habit: habit)
                        }
                    }
                }
            }
        }
    }
}

struct HabitChip: View {
    @Environment(\.modelContext) private var context
    let habit: Habit

    private var completed: Bool { habit.isCompleted(on: .now) }

    var body: some View {
        Button {
            toggleToday()
        } label: {
            VStack(spacing: 10) {
                Image(systemName: habit.symbol)
                    .font(.title2)
                    .foregroundStyle(completed ? .white : Color(hex: habit.colorHex))
                    .frame(width: 56, height: 56)
                    .background(completed ? Color(hex: habit.colorHex) : Color(hex: habit.colorHex).opacity(0.14))
                    .clipShape(Circle())
                Text(habit.name)
                    .font(.caption.weight(.semibold))
                    .lineLimit(1)
                Text("🔥 \(habit.currentStreak())")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .frame(width: 92)
            .padding(.vertical, 10)
            .background(Theme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private func toggleToday() {
        let cal = Calendar.current
        let today = cal.startOfDay(for: .now)
        if let existing = habit.logs.first(where: { cal.isDate($0.date, inSameDayAs: today) }) {
            context.delete(existing)
        } else {
            let log = HabitLog(date: today, completed: true)
            log.habit = habit
            context.insert(log)
        }
        try? context.save()
    }
}

enum JournalPrompts {
    static let daily: [String] = [
        "What's one thing you're proud of today?",
        "Who or what are you grateful for right now?",
        "What energy do you want to bring to tomorrow?",
        "What did today teach you about yourself?",
        "Where did you grow this week?",
        "What's a small win you almost overlooked?",
        "What's been on your mind that you haven't said out loud?",
        "If today were a chapter title, what would it be?",
        "What's one thing you can let go of tonight?",
        "What's the next right step?"
    ]
}

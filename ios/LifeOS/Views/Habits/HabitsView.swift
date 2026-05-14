import SwiftUI
import SwiftData

struct HabitsView: View {
    @Environment(\.modelContext) private var context
    @Query private var habits: [Habit]
    @State private var showingNew = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if habits.isEmpty {
                        EmptyStateView(
                            symbol: "checkmark.seal",
                            title: "Build your first habit",
                            message: "Habits are small actions that compound over time. Start with one.",
                            actionLabel: "Add habit",
                            action: { showingNew = true }
                        )
                        .padding(.horizontal)
                    } else {
                        summary
                        VStack(spacing: 12) {
                            ForEach(habits.filter { !$0.isArchived }) { habit in
                                NavigationLink {
                                    HabitDetailView(habit: habit)
                                } label: {
                                    HabitCard(habit: habit)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal)

                        let archived = habits.filter { $0.isArchived }
                        if !archived.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                SectionHeader(title: "Archived")
                                ForEach(archived) { habit in
                                    HabitCard(habit: habit)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                }
                .padding(.vertical, 8)
            }
            .background(Theme.canvas.ignoresSafeArea())
            .navigationTitle("Habits")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showingNew = true } label: {
                        Image(systemName: "plus.circle.fill").font(.title3)
                    }
                }
            }
            .sheet(isPresented: $showingNew) { NewHabitSheet() }
        }
    }

    private var summary: some View {
        let active = habits.filter { !$0.isArchived }
        let bestStreak = active.map { $0.currentStreak() }.max() ?? 0
        let donesToday = active.filter { $0.isCompleted(on: .now) }.count
        return HStack(spacing: 12) {
            StatTile(value: "\(donesToday)/\(active.count)", label: "Today", symbol: "checkmark.circle.fill", tint: Theme.success)
            StatTile(value: "\(bestStreak)", label: "Best streak", symbol: "flame.fill", tint: Theme.warning)
            StatTile(value: "\(active.count)", label: "Active", symbol: "list.bullet", tint: Theme.info)
        }
        .padding(.horizontal)
    }
}

struct HabitCard: View {
    @Environment(\.modelContext) private var context
    @Bindable var habit: Habit

    private let cal = Calendar.current

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(Color(hex: habit.colorHex).opacity(0.15))
                    Image(systemName: habit.symbol)
                        .foregroundStyle(Color(hex: habit.colorHex))
                }
                .frame(width: 42, height: 42)
                VStack(alignment: .leading, spacing: 2) {
                    Text(habit.name).font(.headline)
                    Text("\(habit.completionsThisWeek())/\(habit.targetPerWeek) this week · 🔥 \(habit.currentStreak())")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Button(action: toggleToday) {
                    Image(systemName: habit.isCompleted(on: .now) ? "checkmark.circle.fill" : "circle")
                        .font(.title2)
                        .foregroundStyle(habit.isCompleted(on: .now) ? Color(hex: habit.colorHex) : .secondary)
                }
                .buttonStyle(.plain)
            }

            // last 14 days mini-strip
            HStack(spacing: 4) {
                ForEach(lastDays(14), id: \.self) { day in
                    RoundedRectangle(cornerRadius: 4)
                        .fill(habit.isCompleted(on: day) ? Color(hex: habit.colorHex) : Color.primary.opacity(0.08))
                        .frame(height: 18)
                }
            }
        }
        .card()
    }

    private func lastDays(_ n: Int) -> [Date] {
        let today = cal.startOfDay(for: .now)
        return (0..<n).reversed().compactMap { cal.date(byAdding: .day, value: -$0, to: today) }
    }

    private func toggleToday() {
        let today = cal.startOfDay(for: .now)
        if let existing = habit.logs.first(where: { cal.isDate($0.date, inSameDayAs: today) }) {
            context.delete(existing)
        } else {
            let log = HabitLog(date: today)
            log.habit = habit
            context.insert(log)
        }
        try? context.save()
    }
}

struct HabitDetailView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Bindable var habit: Habit
    @State private var editing = false

    private let cal = Calendar.current

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack(spacing: 14) {
                    ZStack {
                        Circle().fill(Color(hex: habit.colorHex).opacity(0.18))
                        Image(systemName: habit.symbol)
                            .font(.title)
                            .foregroundStyle(Color(hex: habit.colorHex))
                    }
                    .frame(width: 64, height: 64)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(habit.name).font(.title2.weight(.bold))
                        Text(habit.frequency.label).font(.subheadline).foregroundStyle(.secondary)
                    }
                    Spacer()
                }

                HStack(spacing: 12) {
                    StatTile(value: "\(habit.currentStreak())", label: "Current streak", symbol: "flame.fill", tint: Theme.warning)
                    StatTile(value: "\(habit.completionsThisWeek())", label: "This week", symbol: "calendar", tint: Theme.info)
                    StatTile(value: "\(habit.logs.filter { $0.completed }.count)", label: "Total", symbol: "checkmark.circle.fill", tint: Theme.success)
                }

                VStack(alignment: .leading, spacing: 10) {
                    SectionHeader(title: "Last 12 weeks")
                    HabitHeatmap(habit: habit)
                        .card()
                }

                if !habit.habitDetails.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        SectionHeader(title: "Why this habit")
                        Text(habit.habitDetails).card()
                    }
                }
            }
            .padding()
        }
        .background(Theme.canvas.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button { editing = true } label: { Label("Edit", systemImage: "pencil") }
                    Button { habit.isArchived.toggle() } label: {
                        Label(habit.isArchived ? "Unarchive" : "Archive", systemImage: "archivebox")
                    }
                    Button(role: .destructive) {
                        context.delete(habit)
                        try? context.save()
                        dismiss()
                    } label: { Label("Delete", systemImage: "trash") }
                } label: { Image(systemName: "ellipsis.circle") }
            }
        }
        .sheet(isPresented: $editing) { NewHabitSheet(editing: habit) }
    }
}

struct HabitHeatmap: View {
    @Bindable var habit: Habit
    private let cal = Calendar.current
    private let columns = 12
    private let rows = 7

    var body: some View {
        let today = cal.startOfDay(for: .now)
        let totalDays = columns * rows
        let start = cal.date(byAdding: .day, value: -(totalDays - 1), to: today) ?? today
        let days: [Date] = (0..<totalDays).compactMap { cal.date(byAdding: .day, value: $0, to: start) }

        return GeometryReader { geo in
            let cell = (geo.size.width - CGFloat(columns - 1) * 4) / CGFloat(columns)
            VStack(alignment: .leading, spacing: 4) {
                ForEach(0..<rows, id: \.self) { row in
                    HStack(spacing: 4) {
                        ForEach(0..<columns, id: \.self) { col in
                            let idx = col * rows + row
                            if idx < days.count {
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(habit.isCompleted(on: days[idx]) ? Color(hex: habit.colorHex) : Color.primary.opacity(0.06))
                                    .frame(width: cell, height: cell)
                            } else {
                                Color.clear.frame(width: cell, height: cell)
                            }
                        }
                    }
                }
            }
        }
        .frame(height: 7 * 20)
    }
}

struct NewHabitSheet: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    var editing: Habit? = nil

    @State private var name: String = ""
    @State private var habitDetails: String = ""
    @State private var symbol: String = "checkmark.circle.fill"
    @State private var colorHex: String = "#10B981"
    @State private var frequency: HabitFrequency = .daily
    @State private var targetPerWeek: Int = 7
    @State private var hasReminder: Bool = false
    @State private var reminderTime: Date = Calendar.current.date(bySettingHour: 8, minute: 0, second: 0, of: .now) ?? .now

    private let symbols = ["checkmark.circle.fill", "drop.fill", "figure.run", "book.fill", "moon.zzz.fill", "fork.knife", "dumbbell.fill", "brain.head.profile", "leaf.fill", "heart.fill", "pencil", "music.note"]
    private let palette = ["#10B981", "#3B82F6", "#7C3AED", "#F59E0B", "#EC4899", "#14B8A6", "#EF4444", "#22D3EE"]

    var body: some View {
        NavigationStack {
            Form {
                Section("Habit") {
                    TextField("Name", text: $name)
                    TextField("Why this matters (optional)", text: $habitDetails, axis: .vertical).lineLimit(2...4)
                }
                Section("Frequency") {
                    Picker("Repeats", selection: $frequency) {
                        ForEach(HabitFrequency.allCases) { Text($0.label).tag($0) }
                    }
                    Stepper(value: $targetPerWeek, in: 1...7) {
                        Text("Target: \(targetPerWeek) per week")
                    }
                }
                Section("Reminder") {
                    Toggle("Daily reminder", isOn: $hasReminder)
                    if hasReminder {
                        DatePicker("Time", selection: $reminderTime, displayedComponents: .hourAndMinute)
                    }
                }
                Section("Icon") {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 6)) {
                        ForEach(symbols, id: \.self) { s in
                            Image(systemName: s)
                                .font(.title3)
                                .foregroundStyle(symbol == s ? .white : Color(hex: colorHex))
                                .frame(width: 40, height: 40)
                                .background(symbol == s ? Color(hex: colorHex) : Color(hex: colorHex).opacity(0.12))
                                .clipShape(Circle())
                                .onTapGesture { symbol = s }
                        }
                    }
                }
                Section("Color") {
                    HStack {
                        ForEach(palette, id: \.self) { hex in
                            Circle()
                                .fill(Color(hex: hex))
                                .frame(width: 28, height: 28)
                                .overlay(Circle().stroke(Color.primary, lineWidth: colorHex == hex ? 2 : 0))
                                .onTapGesture { colorHex = hex }
                        }
                    }
                }
            }
            .navigationTitle(editing == nil ? "New habit" : "Edit habit")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save", action: save)
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                        .fontWeight(.semibold)
                }
            }
            .onAppear {
                if let h = editing {
                    name = h.name
                    habitDetails = h.habitDetails
                    symbol = h.symbol
                    colorHex = h.colorHex
                    frequency = h.frequency
                    targetPerWeek = h.targetPerWeek
                    if let hour = h.reminderHour, let minute = h.reminderMinute {
                        hasReminder = true
                        reminderTime = Calendar.current.date(bySettingHour: hour, minute: minute, second: 0, of: .now) ?? .now
                    }
                }
            }
        }
    }

    private func save() {
        let comps = Calendar.current.dateComponents([.hour, .minute], from: reminderTime)
        if let h = editing {
            h.name = name
            h.habitDetails = habitDetails
            h.symbol = symbol
            h.colorHex = colorHex
            h.frequency = frequency
            h.targetPerWeek = targetPerWeek
            h.reminderHour = hasReminder ? comps.hour : nil
            h.reminderMinute = hasReminder ? comps.minute : nil
        } else {
            let h = Habit(
                name: name,
                habitDetails: habitDetails,
                symbol: symbol,
                colorHex: colorHex,
                frequency: frequency,
                targetPerWeek: targetPerWeek,
                reminderHour: hasReminder ? comps.hour : nil,
                reminderMinute: hasReminder ? comps.minute : nil
            )
            context.insert(h)
        }
        try? context.save()
        dismiss()
    }
}

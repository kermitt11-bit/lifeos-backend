import SwiftUI
import SwiftData

struct GoalsView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Goal.targetDate, order: .forward) private var goals: [Goal]
    @State private var showingNew = false
    @State private var filter: GoalTimeframe? = nil

    private var filtered: [Goal] {
        let base = goals.filter { !$0.isCompleted }
        if let filter { return base.filter { $0.timeframe == filter } }
        return base
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if goals.isEmpty {
                        EmptyStateView(
                            symbol: "target",
                            title: "Set your first goal",
                            message: "Big change starts with a clear target. What do you want next?",
                            actionLabel: "Add goal",
                            action: { showingNew = true }
                        )
                        .padding(.horizontal)
                    } else {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                filterChip(label: "All", isOn: filter == nil) { filter = nil }
                                ForEach(GoalTimeframe.allCases) { t in
                                    filterChip(label: t.label, isOn: filter == t) {
                                        filter = (filter == t) ? nil : t
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }

                        ForEach(filtered) { goal in
                            NavigationLink {
                                GoalDetailView(goal: goal)
                            } label: {
                                GoalCard(goal: goal)
                            }
                            .buttonStyle(.plain)
                            .padding(.horizontal)
                        }

                        let completed = goals.filter { $0.isCompleted }
                        if !completed.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                SectionHeader(title: "Completed", subtitle: "\(completed.count) done")
                                ForEach(completed) { goal in
                                    GoalCard(goal: goal)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                }
                .padding(.vertical, 8)
            }
            .background(Theme.canvas.ignoresSafeArea())
            .navigationTitle("Goals")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showingNew = true } label: {
                        Image(systemName: "plus.circle.fill").font(.title3)
                    }
                }
            }
            .sheet(isPresented: $showingNew) { NewGoalSheet() }
        }
    }

    private func filterChip(label: String, isOn: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.caption.weight(.semibold))
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isOn ? Theme.accent : Theme.surface)
                .foregroundStyle(isOn ? .white : .primary)
                .clipShape(Capsule())
        }
    }
}

struct GoalCard: View {
    @Bindable var goal: Goal

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                Image(systemName: goal.area.symbol)
                    .foregroundStyle(Theme.accent)
                Text(goal.title).font(.headline)
                Spacer()
                if goal.isCompleted {
                    Image(systemName: "checkmark.seal.fill").foregroundStyle(Theme.success)
                }
            }
            if !goal.goalDescription.isEmpty {
                Text(goal.goalDescription)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
            ProgressView(value: goal.progress)
                .tint(Theme.accent)
            HStack(spacing: 8) {
                Chip(text: goal.timeframe.label)
                Chip(text: goal.area.label, symbol: goal.area.symbol)
                Spacer()
                Text(daysRemainingText)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(goal.daysRemaining < 0 ? Theme.danger : .secondary)
            }
        }
        .card()
    }

    private var daysRemainingText: String {
        let days = goal.daysRemaining
        if days < 0 { return "\(-days)d overdue" }
        if days == 0 { return "Due today" }
        return "\(days)d left"
    }
}

struct GoalDetailView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Bindable var goal: Goal

    var body: some View {
        Form {
            Section("Goal") {
                TextField("Title", text: $goal.title)
                TextField("Description", text: $goal.goalDescription, axis: .vertical).lineLimit(3...8)
            }
            Section("Area & timeframe") {
                Picker("Area", selection: $goal.areaRaw) {
                    ForEach(GoalArea.allCases) { Text($0.label).tag($0.rawValue) }
                }
                Picker("Timeframe", selection: $goal.timeframeRaw) {
                    ForEach(GoalTimeframe.allCases) { Text($0.label).tag($0.rawValue) }
                }
                DatePicker("Target date", selection: $goal.targetDate, displayedComponents: .date)
            }
            Section("Progress") {
                VStack(alignment: .leading) {
                    Slider(value: $goal.progress, in: 0...1, step: 0.05)
                        .tint(Theme.accent)
                    Text("\(Int(goal.progress * 100))%")
                        .font(.headline)
                }
                Toggle("Mark as completed", isOn: $goal.isCompleted)
            }
            Section("Milestones") {
                TextField("Free-form milestones", text: $goal.milestoneSummary, axis: .vertical)
                    .lineLimit(3...10)
            }
            Section("Linked tasks") {
                if goal.linkedTasks.isEmpty {
                    Text("Linked tasks will appear here.").foregroundStyle(.secondary)
                } else {
                    ForEach(goal.linkedTasks) { task in
                        Text(task.title)
                    }
                }
            }
            Section {
                Button(role: .destructive) {
                    context.delete(goal)
                    try? context.save()
                    dismiss()
                } label: { Label("Delete goal", systemImage: "trash") }
            }
        }
        .navigationTitle("Goal")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Save") { try? context.save() }
                    .fontWeight(.semibold)
            }
        }
    }
}

struct NewGoalSheet: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @State private var title: String = ""
    @State private var goalDescription: String = ""
    @State private var area: GoalArea = .career
    @State private var timeframe: GoalTimeframe = .month
    @State private var targetDate: Date = Calendar.current.date(byAdding: .month, value: 1, to: .now) ?? .now

    var body: some View {
        NavigationStack {
            Form {
                Section("Goal") {
                    TextField("Title", text: $title)
                    TextField("Why this matters", text: $goalDescription, axis: .vertical).lineLimit(2...6)
                }
                Section("Area & timeframe") {
                    Picker("Area", selection: $area) {
                        ForEach(GoalArea.allCases) {
                            Label($0.label, systemImage: $0.symbol).tag($0)
                        }
                    }
                    Picker("Timeframe", selection: $timeframe) {
                        ForEach(GoalTimeframe.allCases) { Text($0.label).tag($0) }
                    }
                    DatePicker("Target", selection: $targetDate, displayedComponents: .date)
                }
            }
            .navigationTitle("New goal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        let goal = Goal(
                            title: title.trimmingCharacters(in: .whitespaces),
                            goalDescription: goalDescription,
                            timeframe: timeframe,
                            area: area,
                            targetDate: targetDate
                        )
                        context.insert(goal)
                        try? context.save()
                        dismiss()
                    }
                    .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
                    .fontWeight(.semibold)
                }
            }
        }
    }
}

import SwiftUI
import SwiftData

struct AddTaskSheet: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    let defaultDate: Date

    @State private var title = ""
    @State private var taskNotes = ""
    @State private var dueDate: Date
    @State private var priority: TaskPriority = .medium
    @State private var category: TaskCategory = .personal
    @State private var estimatedMinutes: Int = 30
    @State private var hasReminder = false
    @State private var reminderDate: Date = .now

    init(defaultDate: Date) {
        self.defaultDate = defaultDate
        _dueDate = State(initialValue: defaultDate)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("What") {
                    TextField("Title", text: $title)
                    TextField("Notes (optional)", text: $taskNotes, axis: .vertical)
                        .lineLimit(2...6)
                }
                Section("When") {
                    DatePicker("Due", selection: $dueDate, displayedComponents: [.date, .hourAndMinute])
                    Stepper(value: $estimatedMinutes, in: 5...480, step: 5) {
                        Text("Estimate: \(estimatedMinutes) min")
                    }
                    Toggle("Remind me", isOn: $hasReminder)
                    if hasReminder {
                        DatePicker("At", selection: $reminderDate, displayedComponents: [.date, .hourAndMinute])
                    }
                }
                Section("How") {
                    Picker("Priority", selection: $priority) {
                        ForEach(TaskPriority.allCases) { Text($0.label).tag($0) }
                    }
                    Picker("Category", selection: $category) {
                        ForEach(TaskCategory.allCases) {
                            Label($0.label, systemImage: $0.symbol).tag($0)
                        }
                    }
                }
            }
            .navigationTitle("New task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save", action: save)
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }

    private func save() {
        let task = PlannerTask(
            title: title.trimmingCharacters(in: .whitespaces),
            taskNotes: taskNotes,
            dueDate: dueDate,
            priority: priority,
            category: category,
            estimatedMinutes: estimatedMinutes,
            reminderDate: hasReminder ? reminderDate : nil
        )
        context.insert(task)
        try? context.save()
        if hasReminder { NotificationManager.shared.scheduleReminder(for: task) }
        dismiss()
    }
}

struct AddTimeBlockSheet: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    let defaultDate: Date
    @State private var title = ""
    @State private var startDate: Date
    @State private var endDate: Date
    @State private var colorHex: String = "#7C3AED"
    @State private var blockNotes = ""

    private let palette = ["#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#14B8A6"]

    init(defaultDate: Date) {
        self.defaultDate = defaultDate
        let cal = Calendar.current
        let start = cal.date(bySettingHour: 9, minute: 0, second: 0, of: defaultDate) ?? defaultDate
        let end = cal.date(byAdding: .hour, value: 1, to: start) ?? start
        _startDate = State(initialValue: start)
        _endDate = State(initialValue: end)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Block") {
                    TextField("Title", text: $title)
                    DatePicker("Start", selection: $startDate)
                    DatePicker("End", selection: $endDate, in: startDate...)
                    TextField("Notes", text: $blockNotes, axis: .vertical).lineLimit(2...4)
                }
                Section("Color") {
                    HStack {
                        ForEach(palette, id: \.self) { hex in
                            Circle()
                                .fill(Color(hex: hex))
                                .frame(width: 28, height: 28)
                                .overlay(
                                    Circle()
                                        .stroke(Color.primary, lineWidth: colorHex == hex ? 2 : 0)
                                )
                                .onTapGesture { colorHex = hex }
                        }
                    }
                }
            }
            .navigationTitle("Time block")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save", action: save)
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }

    private func save() {
        let block = TimeBlock(
            title: title.trimmingCharacters(in: .whitespaces),
            startDate: startDate,
            endDate: endDate,
            colorHex: colorHex,
            blockNotes: blockNotes
        )
        context.insert(block)
        try? context.save()
        dismiss()
    }
}

struct TaskDetailSheet: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Bindable var task: PlannerTask
    @State private var newSubtask: String = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Task") {
                    TextField("Title", text: $task.title)
                    TextField("Notes", text: $task.taskNotes, axis: .vertical).lineLimit(3...8)
                }
                Section("Schedule") {
                    DatePicker("Due", selection: $task.dueDate, displayedComponents: [.date, .hourAndMinute])
                    Stepper(value: $task.estimatedMinutes, in: 5...480, step: 5) {
                        Text("Estimate: \(task.estimatedMinutes) min")
                    }
                    Stepper(value: $task.actualMinutes, in: 0...720, step: 5) {
                        Text("Actual: \(task.actualMinutes) min")
                    }
                }
                Section("Priority & Category") {
                    Picker("Priority", selection: $task.priorityRaw) {
                        ForEach(TaskPriority.allCases) { Text($0.label).tag($0.rawValue) }
                    }
                    Picker("Category", selection: $task.categoryRaw) {
                        ForEach(TaskCategory.allCases) { Text($0.label).tag($0.rawValue) }
                    }
                }
                Section("Subtasks") {
                    ForEach(task.subtasks.sorted(by: { $0.order < $1.order })) { sub in
                        HStack {
                            Button { sub.isCompleted.toggle() } label: {
                                Image(systemName: sub.isCompleted ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(sub.isCompleted ? Theme.success : .secondary)
                            }
                            Text(sub.title)
                                .strikethrough(sub.isCompleted)
                            Spacer()
                        }
                    }
                    .onDelete { idx in
                        let items = task.subtasks.sorted(by: { $0.order < $1.order })
                        for i in idx { context.delete(items[i]) }
                    }
                    HStack {
                        TextField("New subtask", text: $newSubtask)
                        Button("Add") {
                            let trimmed = newSubtask.trimmingCharacters(in: .whitespaces)
                            guard !trimmed.isEmpty else { return }
                            let sub = Subtask(title: trimmed, order: task.subtasks.count)
                            task.subtasks.append(sub)
                            newSubtask = ""
                        }
                        .disabled(newSubtask.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                }
                Section {
                    Button(role: .destructive) {
                        context.delete(task)
                        dismiss()
                    } label: {
                        Label("Delete task", systemImage: "trash")
                    }
                }
            }
            .navigationTitle("Edit task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { try? context.save(); dismiss() }
                }
            }
        }
    }
}

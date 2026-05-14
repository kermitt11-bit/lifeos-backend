import SwiftUI
import SwiftData

struct PlannerView: View {
    @Environment(\.modelContext) private var context
    @Query private var tasks: [PlannerTask]
    @Query private var blocks: [TimeBlock]

    @State private var selectedDate: Date = Calendar.current.startOfDay(for: .now)
    @State private var showingAddTask = false
    @State private var showingAddBlock = false
    @State private var mode: Mode = .list

    enum Mode: String, CaseIterable { case list = "List", schedule = "Schedule" }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                WeekStrip(selectedDate: $selectedDate)
                    .padding(.vertical, 8)
                    .background(Theme.canvas)

                Picker("Mode", selection: $mode) {
                    ForEach(Mode.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)
                .padding(.bottom, 8)

                if mode == .list {
                    listView
                } else {
                    ScheduleView(date: selectedDate, blocks: dayBlocks)
                }
            }
            .background(Theme.canvas.ignoresSafeArea())
            .navigationTitle("Planner")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button { showingAddTask = true } label: { Label("New Task", systemImage: "checklist") }
                        Button { showingAddBlock = true } label: { Label("New Time Block", systemImage: "rectangle.split.2x1") }
                    } label: {
                        Image(systemName: "plus.circle.fill").font(.title3)
                    }
                }
            }
            .sheet(isPresented: $showingAddTask) { AddTaskSheet(defaultDate: selectedDate) }
            .sheet(isPresented: $showingAddBlock) { AddTimeBlockSheet(defaultDate: selectedDate) }
        }
    }

    private var dayTasks: [PlannerTask] {
        let cal = Calendar.current
        return tasks
            .filter { cal.isDate($0.dueDate, inSameDayAs: selectedDate) }
            .sorted {
                if $0.isCompleted != $1.isCompleted { return !$0.isCompleted }
                return $0.priority.rawValue > $1.priority.rawValue
            }
    }

    private var dayBlocks: [TimeBlock] {
        let cal = Calendar.current
        return blocks
            .filter { cal.isDate($0.startDate, inSameDayAs: selectedDate) }
            .sorted { $0.startDate < $1.startDate }
    }

    @ViewBuilder
    private var listView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                summaryRow

                if !dayBlocks.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        SectionHeader(title: "Time blocks")
                        ForEach(dayBlocks) { block in
                            TimeBlockRow(block: block)
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 10) {
                    SectionHeader(title: "Tasks")
                    if dayTasks.isEmpty {
                        EmptyStateView(
                            symbol: "checklist",
                            title: "Nothing planned",
                            message: "Tap + to add a task or time block to this day.",
                            actionLabel: "Add task",
                            action: { showingAddTask = true }
                        )
                        .card()
                    } else {
                        ForEach(dayTasks) { task in
                            TaskRow(task: task)
                        }
                    }
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 24)
        }
    }

    private var summaryRow: some View {
        let completed = dayTasks.filter { $0.isCompleted }.count
        let total = dayTasks.count
        let scheduled = Int(dayBlocks.reduce(0) { $0 + $1.duration } / 60)
        return HStack(spacing: 12) {
            StatTile(value: "\(completed)/\(total)", label: "Tasks done", symbol: "checkmark.circle.fill", tint: Theme.success)
            StatTile(value: "\(scheduled)m", label: "Scheduled", symbol: "clock.fill", tint: Theme.info)
            StatTile(value: "\(dayTasks.filter { $0.priority == .urgent || $0.priority == .high }.count)", label: "High-pri", symbol: "flame.fill", tint: Theme.warning)
        }
    }
}

struct WeekStrip: View {
    @Binding var selectedDate: Date
    private let cal = Calendar.current

    private var days: [Date] {
        let start = cal.dateInterval(of: .weekOfYear, for: selectedDate)?.start ?? selectedDate
        return (0..<7).compactMap { cal.date(byAdding: .day, value: $0, to: start) }
    }

    var body: some View {
        VStack(spacing: 6) {
            HStack {
                Text(selectedDate.formatted(.dateTime.month(.wide).year()))
                    .font(.subheadline.weight(.semibold))
                Spacer()
                Button {
                    selectedDate = cal.startOfDay(for: .now)
                } label: {
                    Text("Today").font(.caption.weight(.semibold))
                }
            }
            .padding(.horizontal)

            HStack(spacing: 6) {
                ForEach(days, id: \.self) { day in
                    DayCell(date: day, isSelected: cal.isDate(day, inSameDayAs: selectedDate))
                        .onTapGesture { selectedDate = day }
                }
            }
            .padding(.horizontal)
        }
    }
}

struct DayCell: View {
    let date: Date
    let isSelected: Bool
    private let cal = Calendar.current

    var body: some View {
        VStack(spacing: 4) {
            Text(date.formatted(.dateTime.weekday(.narrow)))
                .font(.caption2.weight(.medium))
                .foregroundStyle(isSelected ? .white : .secondary)
            Text("\(cal.component(.day, from: date))")
                .font(.headline)
                .foregroundStyle(isSelected ? .white : .primary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(isSelected ? Theme.accent : (cal.isDateInToday(date) ? Theme.accent.opacity(0.12) : Color.clear))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

struct TaskRow: View {
    @Environment(\.modelContext) private var context
    @Bindable var task: PlannerTask
    @State private var showingDetail = false

    var body: some View {
        Button { showingDetail = true } label: {
            HStack(spacing: 12) {
                Button(action: toggle) {
                    Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                        .font(.title3)
                        .foregroundStyle(task.isCompleted ? Theme.success : .secondary)
                }
                .buttonStyle(.plain)

                VStack(alignment: .leading, spacing: 4) {
                    Text(task.title)
                        .font(.body.weight(.medium))
                        .strikethrough(task.isCompleted, color: .secondary)
                        .foregroundStyle(task.isCompleted ? .secondary : .primary)
                    HStack(spacing: 8) {
                        Chip(text: task.category.label, symbol: task.category.symbol,
                             color: Theme.categoryColors[task.category.rawValue] ?? Theme.accent)
                        if task.priority != .low {
                            Chip(text: task.priority.label, symbol: task.priority.symbol,
                                 color: priorityColor)
                        }
                        if task.estimatedMinutes > 0 {
                            Text("\(task.estimatedMinutes)m")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                Spacer()
                if task.isOverdue {
                    Image(systemName: "exclamationmark.circle.fill")
                        .foregroundStyle(Theme.danger)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(Theme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
        .sheet(isPresented: $showingDetail) { TaskDetailSheet(task: task) }
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) {
                context.delete(task)
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
    }

    private var priorityColor: Color {
        switch task.priority {
        case .low: return .gray
        case .medium: return Theme.info
        case .high: return Theme.warning
        case .urgent: return Theme.danger
        }
    }

    private func toggle() {
        task.isCompleted.toggle()
        task.completedAt = task.isCompleted ? .now : nil
        try? context.save()
    }
}

struct TimeBlockRow: View {
    let block: TimeBlock

    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 4)
                .fill(Color(hex: block.colorHex))
                .frame(width: 4)
            VStack(alignment: .leading, spacing: 2) {
                Text(block.title).font(.body.weight(.medium))
                Text("\(block.startDate.formatted(date: .omitted, time: .shortened)) – \(block.endDate.formatted(date: .omitted, time: .shortened))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Text("\(Int(block.duration / 60))m")
                .font(.caption.weight(.medium))
                .foregroundStyle(.secondary)
        }
        .padding(12)
        .background(Theme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

struct ScheduleView: View {
    let date: Date
    let blocks: [TimeBlock]
    private let hourHeight: CGFloat = 56
    private let startHour: Int = 6
    private let endHour: Int = 23

    var body: some View {
        ScrollView {
            ZStack(alignment: .topLeading) {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(startHour...endHour, id: \.self) { hour in
                        HStack(alignment: .top, spacing: 8) {
                            Text(hourLabel(hour))
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                                .frame(width: 44, alignment: .trailing)
                            Rectangle()
                                .fill(Color.primary.opacity(0.06))
                                .frame(height: 1)
                                .padding(.top, 6)
                        }
                        .frame(height: hourHeight, alignment: .top)
                    }
                }

                ForEach(blocks) { block in
                    blockView(block)
                }
            }
            .padding()
        }
    }

    private func hourLabel(_ hour: Int) -> String {
        let h = hour % 12 == 0 ? 12 : hour % 12
        let suffix = hour < 12 ? "AM" : "PM"
        return "\(h) \(suffix)"
    }

    private func blockView(_ block: TimeBlock) -> some View {
        let cal = Calendar.current
        let startComps = cal.dateComponents([.hour, .minute], from: block.startDate)
        let endComps = cal.dateComponents([.hour, .minute], from: block.endDate)
        let startMin = (startComps.hour ?? 0) * 60 + (startComps.minute ?? 0)
        let endMin = (endComps.hour ?? 0) * 60 + (endComps.minute ?? 0)
        let topOffset = CGFloat(startMin - startHour * 60) / 60 * hourHeight
        let height = max(CGFloat(endMin - startMin) / 60 * hourHeight, 24)
        return VStack(alignment: .leading, spacing: 2) {
            Text(block.title).font(.caption.weight(.semibold)).foregroundStyle(.white)
            Text("\(block.startDate.formatted(date: .omitted, time: .shortened)) – \(block.endDate.formatted(date: .omitted, time: .shortened))")
                .font(.caption2).foregroundStyle(.white.opacity(0.85))
        }
        .padding(8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .frame(height: height, alignment: .topLeading)
        .background(Color(hex: block.colorHex))
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        .padding(.leading, 56)
        .offset(y: topOffset)
    }
}

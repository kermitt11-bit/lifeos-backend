import Foundation
import SwiftData

enum TaskPriority: Int, Codable, CaseIterable, Identifiable {
    case low = 0, medium = 1, high = 2, urgent = 3
    var id: Int { rawValue }
    var label: String {
        switch self {
        case .low: return "Low"
        case .medium: return "Medium"
        case .high: return "High"
        case .urgent: return "Urgent"
        }
    }
    var symbol: String {
        switch self {
        case .low: return "flag"
        case .medium: return "flag.fill"
        case .high: return "exclamationmark.triangle.fill"
        case .urgent: return "flame.fill"
        }
    }
}

enum TaskCategory: String, Codable, CaseIterable, Identifiable {
    case personal, work, health, learning, errand, social, finance, creative
    var id: String { rawValue }
    var label: String { rawValue.capitalized }
    var symbol: String {
        switch self {
        case .personal: return "person.fill"
        case .work: return "briefcase.fill"
        case .health: return "heart.fill"
        case .learning: return "book.fill"
        case .errand: return "cart.fill"
        case .social: return "person.2.fill"
        case .finance: return "dollarsign.circle.fill"
        case .creative: return "paintbrush.fill"
        }
    }
}

@Model
final class PlannerTask {
    @Attribute(.unique) var id: UUID
    var title: String
    var taskNotes: String
    var dueDate: Date
    var isCompleted: Bool
    var completedAt: Date?
    var priorityRaw: Int
    var categoryRaw: String
    var estimatedMinutes: Int
    var actualMinutes: Int
    var recurrenceRule: String?
    var reminderDate: Date?
    var createdAt: Date

    @Relationship(deleteRule: .cascade) var subtasks: [Subtask] = []
    var goal: Goal?

    init(
        id: UUID = UUID(),
        title: String,
        taskNotes: String = "",
        dueDate: Date = .now,
        priority: TaskPriority = .medium,
        category: TaskCategory = .personal,
        estimatedMinutes: Int = 30,
        reminderDate: Date? = nil,
        recurrenceRule: String? = nil
    ) {
        self.id = id
        self.title = title
        self.taskNotes = taskNotes
        self.dueDate = dueDate
        self.isCompleted = false
        self.completedAt = nil
        self.priorityRaw = priority.rawValue
        self.categoryRaw = category.rawValue
        self.estimatedMinutes = estimatedMinutes
        self.actualMinutes = 0
        self.recurrenceRule = recurrenceRule
        self.reminderDate = reminderDate
        self.createdAt = .now
    }

    var priority: TaskPriority {
        get { TaskPriority(rawValue: priorityRaw) ?? .medium }
        set { priorityRaw = newValue.rawValue }
    }

    var category: TaskCategory {
        get { TaskCategory(rawValue: categoryRaw) ?? .personal }
        set { categoryRaw = newValue.rawValue }
    }

    var isOverdue: Bool {
        !isCompleted && dueDate < Calendar.current.startOfDay(for: .now)
    }
}

@Model
final class Subtask {
    @Attribute(.unique) var id: UUID
    var title: String
    var isCompleted: Bool
    var order: Int

    init(id: UUID = UUID(), title: String, order: Int = 0) {
        self.id = id
        self.title = title
        self.isCompleted = false
        self.order = order
    }
}

@Model
final class TimeBlock {
    @Attribute(.unique) var id: UUID
    var title: String
    var startDate: Date
    var endDate: Date
    var colorHex: String
    var blockNotes: String

    init(
        id: UUID = UUID(),
        title: String,
        startDate: Date,
        endDate: Date,
        colorHex: String = "#7C3AED",
        blockNotes: String = ""
    ) {
        self.id = id
        self.title = title
        self.startDate = startDate
        self.endDate = endDate
        self.colorHex = colorHex
        self.blockNotes = blockNotes
    }

    var duration: TimeInterval { endDate.timeIntervalSince(startDate) }
}

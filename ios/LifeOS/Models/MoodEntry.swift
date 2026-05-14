import Foundation
import SwiftData

@Model
final class MoodEntry {
    @Attribute(.unique) var id: UUID
    var date: Date
    var score: Int
    var energy: Int
    var stress: Int
    var moodNotes: String
    var tags: [String]

    init(
        id: UUID = UUID(),
        date: Date = .now,
        score: Int = 5,
        energy: Int = 5,
        stress: Int = 5,
        moodNotes: String = "",
        tags: [String] = []
    ) {
        self.id = id
        self.date = date
        self.score = score
        self.energy = energy
        self.stress = stress
        self.moodNotes = moodNotes
        self.tags = tags
    }

    var emoji: String {
        switch score {
        case ...1: return "😞"
        case 2...3: return "😕"
        case 4...5: return "😐"
        case 6...7: return "🙂"
        case 8...9: return "😊"
        default: return "🤩"
        }
    }
}

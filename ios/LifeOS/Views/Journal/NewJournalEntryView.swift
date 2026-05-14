import SwiftUI
import SwiftData

struct NewJournalEntryView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @Query(sort: \JournalEntry.date, order: .reverse) private var entries: [JournalEntry]

    @State private var title: String = ""
    @State private var bodyText: String = ""
    @State private var moodScore: Int = 6
    @State private var gratitude: [String] = ["", "", ""]
    @State private var highlights: [String] = [""]
    @State private var challenges: String = ""
    @State private var tomorrowFocus: String = ""
    @State private var tagsText: String = ""
    @State private var prompt: String = ""

    private var todayEntry: JournalEntry? {
        entries.first { Calendar.current.isDateInToday($0.date) }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        Image(systemName: "sparkles").foregroundStyle(Theme.accent)
                        Text(prompt)
                            .font(.callout)
                            .italic()
                        Spacer()
                        Button { prompt = JournalPrompts.daily.randomElement() ?? prompt } label: {
                            Image(systemName: "arrow.triangle.2.circlepath")
                        }
                    }
                }

                Section("Title") {
                    TextField("A name for today (optional)", text: $title)
                }

                Section("Mood") {
                    HStack(spacing: 12) {
                        Text(emoji(for: moodScore)).font(.system(size: 38))
                        MoodSlider(value: $moodScore, label: "How was today?")
                    }
                }

                Section("Reflection") {
                    TextField("Write your thoughts…", text: $bodyText, axis: .vertical)
                        .lineLimit(6...20)
                }

                Section("Three things I'm grateful for") {
                    ForEach(0..<3) { i in
                        TextField("Gratitude \(i + 1)", text: Binding(
                            get: { gratitude.indices.contains(i) ? gratitude[i] : "" },
                            set: {
                                while gratitude.count <= i { gratitude.append("") }
                                gratitude[i] = $0
                            }
                        ))
                    }
                }

                Section("Highlights") {
                    ForEach(highlights.indices, id: \.self) { i in
                        TextField("Highlight \(i + 1)", text: Binding(
                            get: { highlights[i] },
                            set: { highlights[i] = $0 }
                        ))
                    }
                    Button {
                        highlights.append("")
                    } label: {
                        Label("Add highlight", systemImage: "plus.circle")
                    }
                }

                Section("Challenges") {
                    TextField("What didn't go to plan?", text: $challenges, axis: .vertical)
                        .lineLimit(2...6)
                }

                Section("Tomorrow's focus") {
                    TextField("One thing I want to do tomorrow", text: $tomorrowFocus, axis: .vertical)
                        .lineLimit(2...4)
                }

                Section("Tags") {
                    TextField("comma, separated, tags", text: $tagsText)
                        .autocapitalization(.none)
                }
            }
            .navigationTitle(todayEntry == nil ? "Today's entry" : "Edit today")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save", action: save)
                        .fontWeight(.semibold)
                }
            }
            .onAppear {
                if prompt.isEmpty { prompt = JournalPrompts.daily.randomElement() ?? "What made today meaningful?" }
                if let existing = todayEntry {
                    title = existing.title
                    bodyText = existing.body
                    moodScore = existing.moodScore
                    gratitude = existing.gratitude + Array(repeating: "", count: max(0, 3 - existing.gratitude.count))
                    highlights = existing.highlights.isEmpty ? [""] : existing.highlights
                    challenges = existing.challenges
                    tomorrowFocus = existing.tomorrowFocus
                    tagsText = existing.tags.joined(separator: ", ")
                }
            }
        }
    }

    private func emoji(for score: Int) -> String {
        switch score {
        case ...1: return "😞"
        case 2...3: return "😕"
        case 4...5: return "😐"
        case 6...7: return "🙂"
        case 8...9: return "😊"
        default: return "🤩"
        }
    }

    private func save() {
        let cleanGratitude = gratitude.map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        let cleanHighlights = highlights.map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        let parsedTags = tagsText
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespaces).lowercased() }
            .filter { !$0.isEmpty }

        if let existing = todayEntry {
            existing.title = title
            existing.body = bodyText
            existing.moodScore = moodScore
            existing.gratitude = cleanGratitude
            existing.highlights = cleanHighlights
            existing.challenges = challenges
            existing.tomorrowFocus = tomorrowFocus
            existing.tags = parsedTags
            existing.updatedAt = .now
        } else {
            let entry = JournalEntry(
                date: .now,
                title: title,
                body: bodyText,
                moodScore: moodScore,
                gratitude: cleanGratitude,
                highlights: cleanHighlights,
                challenges: challenges,
                tomorrowFocus: tomorrowFocus,
                tags: parsedTags
            )
            context.insert(entry)
            let mood = MoodEntry(date: .now, score: moodScore, energy: moodScore, stress: 10 - moodScore)
            context.insert(mood)
        }
        try? context.save()
        dismiss()
    }
}

struct JournalEntryDetailView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Bindable var entry: JournalEntry
    @State private var editing = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(entry.date.formatted(.dateTime.weekday(.wide).month(.wide).day().year()))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    HStack {
                        Text(entry.title.isEmpty ? "Entry" : entry.title)
                            .font(.largeTitle.weight(.bold))
                        Spacer()
                        Text(entry.moodEmoji).font(.system(size: 40))
                    }
                    Text("\(entry.moodLabel) · \(entry.wordCount) words")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                if !entry.body.isEmpty {
                    Text(entry.body)
                        .font(.body)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                if !entry.gratitude.isEmpty {
                    sectionBlock(title: "Grateful for", systemImage: "heart.fill") {
                        VStack(alignment: .leading, spacing: 6) {
                            ForEach(entry.gratitude, id: \.self) { g in
                                Label(g, systemImage: "checkmark.circle.fill")
                                    .foregroundStyle(.primary)
                            }
                        }
                    }
                }

                if !entry.highlights.isEmpty {
                    sectionBlock(title: "Highlights", systemImage: "star.fill") {
                        VStack(alignment: .leading, spacing: 6) {
                            ForEach(entry.highlights, id: \.self) { h in
                                Label(h, systemImage: "sparkle")
                            }
                        }
                    }
                }

                if !entry.challenges.isEmpty {
                    sectionBlock(title: "Challenges", systemImage: "exclamationmark.bubble.fill") {
                        Text(entry.challenges)
                    }
                }

                if !entry.tomorrowFocus.isEmpty {
                    sectionBlock(title: "Tomorrow's focus", systemImage: "arrow.right.circle.fill") {
                        Text(entry.tomorrowFocus)
                    }
                }

                if !entry.tags.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 6) {
                            ForEach(entry.tags, id: \.self) { tag in
                                Chip(text: "#\(tag)")
                            }
                        }
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
                    Button(role: .destructive) {
                        context.delete(entry)
                        try? context.save()
                        dismiss()
                    } label: { Label("Delete", systemImage: "trash") }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $editing) { NewJournalEntryView() }
    }

    @ViewBuilder
    private func sectionBlock<Content: View>(title: String, systemImage: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(title, systemImage: systemImage)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Theme.accent)
            content()
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .card()
    }
}

struct MoodCheckinSheet: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @State private var mood: Int = 6
    @State private var energy: Int = 6
    @State private var stress: Int = 4
    @State private var moodNotes: String = ""

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        Spacer()
                        Text(emojiForScore(mood)).font(.system(size: 72))
                        Spacer()
                    }
                    MoodSlider(value: $mood, label: "Mood")
                    MoodSlider(value: $energy, label: "Energy", tint: Theme.success)
                    MoodSlider(value: $stress, label: "Stress", tint: Theme.danger)
                }
                Section("Notes") {
                    TextField("Optional notes…", text: $moodNotes, axis: .vertical)
                        .lineLimit(2...6)
                }
            }
            .navigationTitle("Mood check-in")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        let entry = MoodEntry(date: .now, score: mood, energy: energy, stress: stress, moodNotes: moodNotes)
                        context.insert(entry)
                        try? context.save()
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }

    private func emojiForScore(_ score: Int) -> String {
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

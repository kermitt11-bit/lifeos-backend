import SwiftUI
import SwiftData

struct JournalView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \JournalEntry.date, order: .reverse) private var entries: [JournalEntry]

    @State private var search = ""
    @State private var showingNew = false
    @State private var selectedTag: String? = nil

    private var filtered: [JournalEntry] {
        entries.filter { entry in
            let matchesSearch = search.isEmpty
                || entry.title.localizedCaseInsensitiveContains(search)
                || entry.body.localizedCaseInsensitiveContains(search)
                || entry.tags.contains { $0.localizedCaseInsensitiveContains(search) }
            let matchesTag = selectedTag.map { entry.tags.contains($0) } ?? true
            return matchesSearch && matchesTag
        }
    }

    private var allTags: [String] {
        Array(Set(entries.flatMap { $0.tags })).sorted()
    }

    private var grouped: [(String, [JournalEntry])] {
        let groups = Dictionary(grouping: filtered) { entry -> String in
            entry.date.formatted(.dateTime.month(.wide).year())
        }
        return groups.sorted { lhs, rhs in
            (lhs.value.first?.date ?? .distantPast) > (rhs.value.first?.date ?? .distantPast)
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    summary
                    if !allTags.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                tagPill(name: "All", isSelected: selectedTag == nil) { selectedTag = nil }
                                ForEach(allTags, id: \.self) { tag in
                                    tagPill(name: "#\(tag)", isSelected: selectedTag == tag) {
                                        selectedTag = (selectedTag == tag) ? nil : tag
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }
                    }

                    if entries.isEmpty {
                        EmptyStateView(
                            symbol: "book.closed.fill",
                            title: "Your journal is empty",
                            message: "Capture your first reflection. It only takes a minute.",
                            actionLabel: "Start writing",
                            action: { showingNew = true }
                        )
                        .padding(.horizontal)
                    } else {
                        ForEach(grouped, id: \.0) { month, items in
                            VStack(alignment: .leading, spacing: 10) {
                                Text(month)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(.secondary)
                                    .padding(.horizontal)
                                ForEach(items) { entry in
                                    NavigationLink {
                                        JournalEntryDetailView(entry: entry)
                                    } label: {
                                        JournalEntryCard(entry: entry)
                                    }
                                    .buttonStyle(.plain)
                                    .padding(.horizontal)
                                }
                            }
                        }
                    }
                }
                .padding(.vertical, 8)
            }
            .background(Theme.canvas.ignoresSafeArea())
            .searchable(text: $search, placement: .navigationBarDrawer(displayMode: .always))
            .navigationTitle("Journal")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showingNew = true } label: {
                        Image(systemName: "square.and.pencil").font(.title3)
                    }
                }
            }
            .sheet(isPresented: $showingNew) { NewJournalEntryView() }
        }
    }

    private func tagPill(name: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(name)
                .font(.caption.weight(.semibold))
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Theme.accent : Theme.surface)
                .foregroundStyle(isSelected ? .white : .primary)
                .clipShape(Capsule())
        }
    }

    private var summary: some View {
        let count = entries.count
        let streak = computeStreak()
        let words = entries.reduce(0) { $0 + $1.wordCount }
        return HStack(spacing: 12) {
            StatTile(value: "\(count)", label: "Entries", symbol: "book.closed.fill", tint: Theme.info)
            StatTile(value: "\(streak)", label: "Streak", symbol: "flame.fill", tint: Theme.warning)
            StatTile(value: "\(words)", label: "Words", symbol: "text.alignleft", tint: Theme.accent)
        }
        .padding(.horizontal)
    }

    private func computeStreak() -> Int {
        let cal = Calendar.current
        let dates = Set(entries.map { cal.startOfDay(for: $0.date) })
        var day = cal.startOfDay(for: .now)
        var streak = 0
        while dates.contains(day) {
            streak += 1
            guard let prev = cal.date(byAdding: .day, value: -1, to: day) else { break }
            day = prev
        }
        return streak
    }
}

struct JournalEntryCard: View {
    let entry: JournalEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(entry.title.isEmpty ? entry.date.formatted(.dateTime.month().day().year()) : entry.title)
                        .font(.headline)
                    Text(entry.date.formatted(.dateTime.weekday(.wide).month().day()))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Text(entry.moodEmoji).font(.title)
            }
            if !entry.body.isEmpty {
                Text(entry.body)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(3)
            }
            if !entry.tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(entry.tags, id: \.self) { tag in
                            Chip(text: "#\(tag)", color: Theme.accent)
                        }
                    }
                }
            }
        }
        .card()
    }
}

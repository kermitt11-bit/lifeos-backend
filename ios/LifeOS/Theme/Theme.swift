import SwiftUI

enum Theme {
    static let accent = Color(hex: "#7C3AED")
    static let accentSoft = Color(hex: "#A78BFA")
    static let success = Color(hex: "#10B981")
    static let warning = Color(hex: "#F59E0B")
    static let danger = Color(hex: "#EF4444")
    static let info = Color(hex: "#3B82F6")

    static let surface = Color(uiColor: .secondarySystemGroupedBackground)
    static let canvas = Color(uiColor: .systemGroupedBackground)
    static let cardBorder = Color.primary.opacity(0.06)

    static let cardRadius: CGFloat = 18
    static let chipRadius: CGFloat = 10

    static let categoryColors: [String: Color] = [
        "personal": Color(hex: "#7C3AED"),
        "work": Color(hex: "#3B82F6"),
        "health": Color(hex: "#10B981"),
        "learning": Color(hex: "#F59E0B"),
        "errand": Color(hex: "#6B7280"),
        "social": Color(hex: "#EC4899"),
        "finance": Color(hex: "#14B8A6"),
        "creative": Color(hex: "#F472B6")
    ]
}

extension Color {
    init(hex: String) {
        let s = hex.trimmingCharacters(in: .alphanumerics.inverted)
        var v: UInt64 = 0
        Scanner(string: s).scanHexInt64(&v)
        let r, g, b, a: Double
        switch s.count {
        case 6:
            r = Double((v >> 16) & 0xFF) / 255
            g = Double((v >> 8) & 0xFF) / 255
            b = Double(v & 0xFF) / 255
            a = 1
        case 8:
            r = Double((v >> 24) & 0xFF) / 255
            g = Double((v >> 16) & 0xFF) / 255
            b = Double((v >> 8) & 0xFF) / 255
            a = Double(v & 0xFF) / 255
        default:
            r = 0; g = 0; b = 0; a = 1
        }
        self.init(.sRGB, red: r, green: g, blue: b, opacity: a)
    }

    var hexString: String {
        let ui = UIColor(self)
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        ui.getRed(&r, green: &g, blue: &b, alpha: &a)
        return String(format: "#%02X%02X%02X", Int(r * 255), Int(g * 255), Int(b * 255))
    }
}

struct CardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(16)
            .background(Theme.surface)
            .clipShape(RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous)
                    .stroke(Theme.cardBorder, lineWidth: 1)
            )
    }
}

extension View {
    func card() -> some View { modifier(CardStyle()) }
}

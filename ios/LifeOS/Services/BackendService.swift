import Foundation

final class BackendService {
    static let shared = BackendService()
    private init() {}

    private var baseURL: URL? {
        let raw = UserDefaults.standard.string(forKey: "backendURL") ?? ""
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : URL(string: trimmed)
    }

    private var token: String? {
        UserDefaults.standard.string(forKey: "backendToken")
    }

    func health() async -> String {
        guard let base = baseURL else { return "Backend URL not set." }
        let url = base.appendingPathComponent("health")
        var req = URLRequest(url: url)
        if let token, !token.isEmpty { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        do {
            let (data, response) = try await URLSession.shared.data(for: req)
            if let http = response as? HTTPURLResponse {
                return "HTTP \(http.statusCode): \(String(data: data, encoding: .utf8) ?? "")"
            }
            return "OK"
        } catch {
            return "Failed: \(error.localizedDescription)"
        }
    }

    func push<T: Encodable>(_ payload: T, to path: String) async throws {
        guard let base = baseURL else { throw URLError(.badURL) }
        var req = URLRequest(url: base.appendingPathComponent(path))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token, !token.isEmpty { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        req.httpBody = try encoder.encode(payload)
        _ = try await URLSession.shared.data(for: req)
    }
}

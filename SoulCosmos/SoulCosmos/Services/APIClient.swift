import Foundation

class APIClient {
    static let shared = APIClient()

    var baseURL: String {
        if let url = UserDefaults.standard.string(forKey: "api_base_url"), !url.isEmpty {
            return url
        }
        if let path = Bundle.main.path(forResource: "Config", ofType: "plist"),
           let config = NSDictionary(contentsOfFile: path),
           let url = config["API_BASE_URL"] as? String {
            return url
        }
        return "http://localhost:8066"
    }

    private let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        return URLSession(configuration: config)
    }()

    private func post<T: Decodable>(_ path: String, body: [String: Any]) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(path)") else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw APIError.serverError
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    func fetchProfile(_ info: BirthInfo, lang: String = "zh") async throws -> ProfileResponse {
        let body: [String: Any] = [
            "birth_date": info.birthDateStr,
            "birth_time": info.birthTimeStr,
            "longitude": info.longitude,
            "latitude": info.latitude,
            "gender": info.gender.rawValue,
            "mbti_type": info.mbtiType,
            "lang": lang,
        ]
        return try await post("/api/reading/profile", body: body)
    }

    func fetchDaily(_ info: BirthInfo, lang: String = "zh") async throws -> DailyForecastResponse {
        let body: [String: Any] = [
            "birth_date": info.birthDateStr,
            "gender": info.gender.rawValue,
            "mbti_type": info.mbtiType,
            "lang": lang,
        ]
        return try await post("/api/reading/daily", body: body)
    }

    func fetchWeekly(_ info: BirthInfo, lang: String = "zh") async throws -> WeeklyForecastResponse {
        let body: [String: Any] = [
            "birth_date": info.birthDateStr,
            "gender": info.gender.rawValue,
            "lang": lang,
        ]
        return try await post("/api/reading/weekly", body: body)
    }

    func fetchMonthly(_ info: BirthInfo, lang: String = "zh") async throws -> MonthlyForecastResponse {
        let body: [String: Any] = [
            "birth_date": info.birthDateStr,
            "gender": info.gender.rawValue,
            "lang": lang,
        ]
        return try await post("/api/reading/monthly", body: body)
    }

    enum APIError: LocalizedError {
        case invalidURL, serverError, decodingError
        var errorDescription: String? {
            switch self {
            case .invalidURL: return "Invalid API URL"
            case .serverError: return "Server error"
            case .decodingError: return "Data decoding failed"
            }
        }
    }
}

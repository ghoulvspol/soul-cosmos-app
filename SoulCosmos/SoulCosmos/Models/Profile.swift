import Foundation

struct SoulProfile: Codable {
    let whoYouAre: String?
    let howYouLove: String?
    let whereYouThrive: String?
    let yourShadows: String?
    let yourSeason: String?
    let theFullPicture: String?
    let soulKeywords: [String]?
}

struct ProfileResponse: Codable {
    let success: Bool
    let mode: String?
    let profile: SoulProfile?
    let matchType: String?
}

struct DailyForecastResponse: Codable {
    let success: Bool
    let date: String?
    let forecast: DailyForecast?
}

struct DailyForecast: Codable {
    let theme: String?
    let tip: String?
    let mood: String?
}

struct WeeklyForecastResponse: Codable {
    let success: Bool
    let weekOf: String?
    let forecast: WeeklyForecast?
}

struct WeeklyForecast: Codable {
    let theme: String?
    let themeEn: String?
    let highlightDay: String?
    let highlightReason: String?
}

struct MonthlyForecastResponse: Codable {
    let success: Bool
    let month: String?
    let forecast: MonthlyForecast?
}

struct MonthlyForecast: Codable {
    let theme: String?
    let themeEn: String?
    let focus: String?
    let focusEn: String?
}

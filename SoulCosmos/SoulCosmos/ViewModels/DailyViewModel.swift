import SwiftUI

@MainActor
class DailyViewModel: ObservableObject {
    @Published var forecast: DailyForecast?
    @Published var weeklyForecast: WeeklyForecast?
    @Published var monthlyForecast: MonthlyForecast?
    @Published var isLoading = false
    @Published var errorMessage: String?

    var birthInfo = BirthInfo()

    func loadAll() async {
        isLoading = true
        errorMessage = nil
        async let dailyResult = APIClient.shared.fetchDaily(birthInfo)
        async let weeklyResult = APIClient.shared.fetchWeekly(birthInfo)
        async let monthlyResult = APIClient.shared.fetchMonthly(birthInfo)
        do {
            let (d, w, m) = try await (dailyResult, weeklyResult, monthlyResult)
            forecast = d.forecast
            weeklyForecast = w.forecast
            monthlyForecast = m.forecast
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

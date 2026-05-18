import SwiftUI

@MainActor
class ProfileViewModel: ObservableObject {
    @Published var birthInfo = BirthInfo()
    @Published var currentStep: OnboardingStep = .welcome
    @Published var profile: SoulProfile?
    @Published var isLoading = false
    @Published var errorMessage: String?

    enum OnboardingStep {
        case welcome, birthInfo, mbtiSelect, loading, result
    }

    func generateProfile() async {
        currentStep = .loading
        isLoading = true
        errorMessage = nil
        do {
            let response = try await APIClient.shared.fetchProfile(birthInfo)
            if response.success, let p = response.profile {
                profile = p
                currentStep = .result
            } else {
                errorMessage = "生成失败，请重试"
                currentStep = .mbtiSelect
            }
        } catch {
            errorMessage = error.localizedDescription
            currentStep = .mbtiSelect
        }
        isLoading = false
    }

    func reset() {
        profile = nil
        birthInfo = BirthInfo()
        currentStep = .welcome
    }
}

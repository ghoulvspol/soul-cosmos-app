import SwiftUI

struct PrivacyConsentView: View {
    @Binding var showPrivacy: Bool
    @State private var agreed = false

    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "lock.shield.fill")
                .font(.system(size: 48))
                .foregroundColor(.cosmosGold)

            Text("Your Privacy Matters")
                .font(CosmosFont.heading(28))
                .foregroundColor(.cosmosTextPrimary)

            VStack(alignment: .leading, spacing: 12) {
                privacyRow(icon: "checkmark.shield", text: "Your data stays on your device and our secure server")
                privacyRow(icon: "person.2.slash", text: "We never share your data with third parties")
                privacyRow(icon: "trash", text: "You can delete all your data anytime in Settings")
                privacyRow(icon: "eye.slash", text: "No advertising tracking")
            }
            .padding()
            .glassCard()

            Toggle(isOn: $agreed) {
                Text("I understand and agree")
                    .font(CosmosFont.body(15))
                    .foregroundColor(.cosmosTextSecondary)
            }
            .tint(.cosmosGold)
            .padding(.horizontal, 8)

            Button("Continue") {
                showPrivacy = false
            }
            .buttonStyle(GoldButtonStyle())
            .disabled(!agreed)
            .opacity(agreed ? 1 : 0.5)

            Link("Privacy Policy", destination: URL(string: "https://ghoulvspol.github.io/soul-cosmos-app/privacy.html")!)
                .font(CosmosFont.body(13))
                .foregroundColor(.cosmosAmethyst)
        }
        .padding(32)
        .background(Color.cosmosCanvas)
    }

    private func privacyRow(icon: String, text: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.cosmosGold)
                .frame(width: 20)
            Text(text)
                .font(CosmosFont.body(14))
                .foregroundColor(.cosmosTextSecondary)
        }
    }
}

import SwiftUI

struct GlassCard: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding()
            .background(Color.cosmosSurface2)
            .cornerRadius(16)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.white.opacity(0.06), lineWidth: 1)
            )
    }
}

struct GoldButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(CosmosFont.body(17).weight(.semibold))
            .foregroundColor(.cosmosCanvas)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(Color.goldGradient)
            .cornerRadius(14)
            .shadow(color: .cosmosGold.opacity(configuration.isPressed ? 0.2 : 0.4), radius: 12)
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
    }
}

struct GhostButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(CosmosFont.body(15))
            .foregroundColor(.cosmosGold)
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.cosmosGold.opacity(0.4), lineWidth: 1)
            )
            .opacity(configuration.isPressed ? 0.7 : 1)
    }
}

extension View {
    func glassCard() -> some View {
        modifier(GlassCard())
    }
}

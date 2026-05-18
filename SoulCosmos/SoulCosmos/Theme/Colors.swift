import SwiftUI

extension Color {
    // Surfaces
    static let cosmosCanvas = Color(hex: 0x06060f)
    static let cosmosSurface1 = Color.white.opacity(0.025)
    static let cosmosSurface2 = Color.white.opacity(0.045)
    static let cosmosSurface3 = Color.white.opacity(0.07)

    // Brand
    static let cosmosGold = Color(hex: 0xd4a574)
    static let cosmosGoldBright = Color(hex: 0xe8c49a)
    static let cosmosGoldDeep = Color(hex: 0xb8860b)
    static let cosmosAmethyst = Color(hex: 0xa78bfa)
    static let cosmosAmethystDeep = Color(hex: 0x7c3aed)
    static let cosmosNebula = Color(hex: 0x6366f1)
    static let cosmosCyan = Color(hex: 0x22d3ee)
    static let cosmosCoral = Color(hex: 0xf87171)
    static let cosmosEmerald = Color(hex: 0x6fcf97)

    // Text
    static let cosmosTextPrimary = Color(hex: 0xf0eff4)
    static let cosmosTextSecondary = Color(hex: 0xa8a3b8)
    static let cosmosTextTertiary = Color(hex: 0x6b6580)
    static let cosmosTextMuted = Color(hex: 0x4a4560)

    // Gradients
    static let goldGradient = LinearGradient(
        colors: [cosmosGold, cosmosGoldBright],
        startPoint: .topLeading, endPoint: .bottomTrailing
    )
    static let nebulaGradient = LinearGradient(
        colors: [cosmosAmethyst, cosmosNebula],
        startPoint: .topLeading, endPoint: .bottomTrailing
    )

    init(hex: UInt, opacity: Double = 1.0) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: opacity
        )
    }
}

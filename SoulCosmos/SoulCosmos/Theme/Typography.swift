import SwiftUI

struct CosmosFont {
    static func heading(_ size: CGFloat) -> Font {
        .custom("Cormorant Garamond", size: size).weight(.semibold)
    }
    static func body(_ size: CGFloat = 16) -> Font {
        .custom("DM Sans", size: size)
    }
    static func cjk(_ size: CGFloat = 16) -> Font {
        .custom("Noto Serif SC", size: size)
    }
}

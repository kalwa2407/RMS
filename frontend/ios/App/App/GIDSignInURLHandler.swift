import UIKit

/// Swift 6 / Xcode 16 compatible helper for forwarding URLs to Google Sign-In.
/// Avoids unsafe ObjC runtime (perform/takeUnretainedValue) by bridging through
/// NSObject subclass casting which is fully supported under strict concurrency.
@objc private protocol GIDSignInHandling: AnyObject {
    @objc optional func handle(_ url: URL) -> Bool
    @objc optional func handleURL(_ url: URL) -> Bool
}

enum GIDSignInURLHandler {
    @discardableResult
    static func handle(_ url: URL) -> Bool {
        // Look up GIDSignIn class safely — returns nil if GoogleSignIn SDK not linked
        guard let gidClass = NSClassFromString("GIDSignIn") as? NSObject.Type else { return false }

        // Get the shared singleton via value(forKey:) — safe, no Unmanaged involved
        guard let instance = gidClass.value(forKey: "sharedInstance") as? NSObject,
              let handler = instance as? GIDSignInHandling else { return false }

        // GIDSignIn v6+ uses handle(_:); older SDK used handleURL(_:)
        if let result = handler.handle?(url) { return result }
        if let result = handler.handleURL?(url) { return result }
        return false
    }
}

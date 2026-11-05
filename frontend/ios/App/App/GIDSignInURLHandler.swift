import UIKit

/// Swift 6 / Xcode 16 compatible helper for forwarding URLs to Google Sign-In and Firebase Phone Auth.
/// Safely invokes selectors via Objective-C runtime so it compiles cleanly without direct framework imports.
enum GIDSignInURLHandler {
    @discardableResult
    static func handle(_ url: URL) -> Bool {
        let nsURL = url as NSURL

        // 1. Google Sign-In URL Handling
        if let gidClass = NSClassFromString("GIDSignIn") as AnyObject?,
           let sharedInstance = gidClass.value(forKey: "sharedInstance") as? NSObject {
            let selHandle = NSSelectorFromString("handle:")
            if sharedInstance.responds(to: selHandle) {
                _ = sharedInstance.perform(selHandle, with: nsURL)
                return true
            }
            let selHandleURL = NSSelectorFromString("handleURL:")
            if sharedInstance.responds(to: selHandleURL) {
                _ = sharedInstance.perform(selHandleURL, with: nsURL)
                return true
            }
        }

        // 2. Firebase Phone Auth reCAPTCHA URL Handling
        if let firAuthClass = NSClassFromString("FIRAuth") as AnyObject?,
           let defaultAuth = firAuthClass.value(forKey: "auth") as? NSObject {
            let selCanHandle = NSSelectorFromString("canHandleURL:")
            if defaultAuth.responds(to: selCanHandle) {
                _ = defaultAuth.perform(selCanHandle, with: nsURL)
                return true
            }
        }

        return false
    }
}

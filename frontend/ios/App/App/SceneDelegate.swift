import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = CAPBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        for context in URLContexts {
            _ = handleGoogleUrl(context.url)
        }
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    private func handleGoogleUrl(_ url: URL) -> Bool {
        guard let gidClass = NSClassFromString("GIDSignIn") as? AnyObject.Type else { return false }
        let sharedSel = NSSelectorFromString("sharedInstance")
        guard gidClass.responds(to: sharedSel),
              let instance = gidClass.perform(sharedSel)?.takeUnretainedValue() as? AnyObject else { return false }
        let handleSel = NSSelectorFromString("handleURL:")
        if instance.responds(to: handleSel) {
            let res = instance.perform(handleSel, with: url)
            return res != nil
        }
        return false
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

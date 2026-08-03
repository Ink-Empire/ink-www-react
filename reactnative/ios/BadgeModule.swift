import Foundation
import UIKit

@objc(BadgeModule)
class BadgeModule: NSObject {
  @objc
  func setBadgeCount(_ count: Double) {
    DispatchQueue.main.async {
      UIApplication.shared.applicationIconBadgeNumber = Int(count)
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}

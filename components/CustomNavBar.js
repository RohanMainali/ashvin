"use client"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "@react-navigation/native"
import { useState } from "react"
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Colors } from "../constants/colors"

const { width } = Dimensions.get("window")

const CustomNavBar = ({ navigation, activeTab = "Home" }) => {
  const { colors } = useTheme()
  const [currentTab, setCurrentTab] = useState(activeTab)

  const navItems = [
    { key: "Home", icon: "home", label: "Home", route: "Home" },
    { key: "Scan", icon: "scan-circle", label: "Scan", route: "Scan" },
    { key: "History", icon: "list", label: "History", route: "MedicalHistory" },
    { key: "Chat", icon: "chatbubbles", label: "Ask AI", route: "Chat" },
    { key: "Profile", icon: "person", label: "Profile", route: "Profile" },
  ]

  const handleNavPress = (item) => {
    setCurrentTab(item.key)
    if (navigation && item.route) {
      navigation.navigate(item.route)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.navContent}>
        {navItems.map((item, index) => {
          const isActive = currentTab === item.key
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.navItem,
                isActive && [styles.activeNavItem, { backgroundColor: Colors.primary + "15" }]
              ]}
              onPress={() => handleNavPress(item)}
              accessibilityLabel={`Navigate to ${item.label}`}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={isActive ? item.icon : `${item.icon}-outline`}
                  size={24}
                  color={isActive ? Colors.primary : colors.text + "80"}
                />
                {isActive && <View style={[styles.activeIndicator, { backgroundColor: Colors.primary }]} />}
              </View>
              <Text
                style={[
                  styles.navLabel,
                  { color: isActive ? Colors.primary : colors.text + "80" },
                  isActive && styles.activeNavLabel
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  navContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    minHeight: 75,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    marginHorizontal: 2,
  },
  activeNavItem: {
    borderRadius: 16,
  },
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  activeIndicator: {
    position: "absolute",
    top: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 2,
  },
  activeNavLabel: {
    fontWeight: "600",
  },
})

export default CustomNavBar

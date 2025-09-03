import React, { useContext, useState, useEffect, useRef } from "react";
import { Animated as RNAnimated } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  SafeAreaView,
  FlatList,
  Dimensions,
} from "react-native";
import { SessionContext } from "../state/session";
import { useTheme } from "../state/theme";
import { useNavigation } from "@react-navigation/native";
import { useSlideMenu } from "./SlideMenuContext";
import { Ionicons } from "@expo/vector-icons";
import { MENU_SCHEMA } from "./menuSchema";

/**
 * Slide Menu Bileşeni - Döngüsel bağımlılıkları önlemek için
 * AppDrawer'dan ayrılmış versiyonu
 */
export default function SlideMenu() {
  const { role, schoolCode, clearSession } = useContext(SessionContext);
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const { menuVisible, closeMenu } = useSlideMenu();
  const slideAnim = useRef(new RNAnimated.Value(-280)).current; // menü genişliği kadar negatif değer

  // Screen dimensions for responsive design
  const { height } = Dimensions.get("window");
  const MAX_LIST_HEIGHT = Math.floor(height * 0.6); // 60% of screen
  const isSmallScreen = height < 700;

  // Menü görünürlüğü değiştiğinde animasyonu başlat
  useEffect(() => {
    RNAnimated.spring(slideAnim, {
      toValue: menuVisible ? 0 : -280,
      useNativeDriver: true,
      friction: 8,
      tension: 65,
    }).start();
  }, [menuVisible]);

  // Accordion state for expanded categories
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Oturumu kapatmak istediğinizden emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: async () => {
          closeMenu();
          await clearSession();
        },
      },
    ]);
  };

  const handleNavigate = (screenName) => {
    closeMenu();

    // Öğrenci bilgilerini geçirmek için özel durumlar
    if (
      screenName === "StudentHomeworkList" ||
      screenName === "StudentAbsences"
    ) {
      // Bu sayfalar için öğrenci bilgilerini geçirmek gerekiyor
      // Şimdilik sadece navigate ediyoruz, öğrenci bilgileri sayfa içinde alınacak
      navigation.navigate(screenName);
    } else {
      navigation.navigate(screenName);
    }
  };

  const toggleCategory = (categoryKey) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  };

  const getMenuData = () => {
    return MENU_SCHEMA[role] || [];
  };

  // Flatten grouped menu into a single-level list of buttons
  const getFlatMenuItems = () => {
    const categories = getMenuData();
    const flat = [];
    categories.forEach((cat) => {
      (cat.items || []).forEach((it) => {
        flat.push({ key: it.key, label: it.label, route: it.route });
      });
    });
    return flat;
  };

  const getItemIcon = (item) => {
    // Basic mapping by common route keys
    const key = item.key || "";
    const map = {
      dashboard: "grid-outline",
      profil: "person-outline",
      "ders-programi": "calendar-outline",
      derslerim: "book-outline",
      ogretmenler: "people-outline",
      ogrenciler: "school-outline",
      yoklama: "checkbox-outline",
      "odev-ver": "create-outline",
      sinavlarim: "document-text-outline",
      mesajlar: "chatbubbles-outline",
      odevlerim: "clipboard-outline",
      devamsizlik: "warning-outline",
    };
    return map[key] || "ellipse-outline";
  };

  const renderMenuItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.menuItem,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
      onPress={() => handleNavigate(item.route || item.screen)}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: theme.accent }]}>
        <Ionicons name={getItemIcon(item)} size={16} color="#fff" />
      </View>
      
      <Text
        style={[
          styles.menuText,
          {
            color: theme.text,
            fontSize: 14,
          },
        ]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
      
      <Ionicons
        name="chevron-forward"
        size={12}
        color={theme.textSecondary || theme.text}
        style={styles.menuArrow}
      />
    </TouchableOpacity>
  );

  const renderCategory = ({ item }) => {
    const isExpanded = expandedCategories.has(item.key);

    return (
      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={[
            styles.categoryHeader,
            {
              backgroundColor: theme.card,
              minHeight: 44,
              paddingVertical: isSmallScreen ? 10 : 12,
              paddingHorizontal: 14,
            },
          ]}
          onPress={() => toggleCategory(item.key)}
          activeOpacity={0.7}
        >
          <View style={styles.categoryTitleRow}>
            <Text style={styles.categoryIcon}>{item.icon}</Text>
            <Text
              style={[
                styles.categoryTitle,
                {
                  color: theme.text,
                  fontSize: isSmallScreen ? 15 : 16,
                },
              ]}
            >
              {item.title}
            </Text>
          </View>
          <Text
            style={[
              styles.expandIcon,
              {
                color: theme.text,
                transform: [{ rotate: isExpanded ? "180deg" : "0deg" }],
              },
            ]}
          >
            ▼
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.subItemsContainer}>
            {item.items.map((subItem) => (
              <TouchableOpacity
                key={subItem.key}
                style={[
                  styles.subMenuItem,
                  {
                    backgroundColor: theme.card,
                    minHeight: 44,
                    paddingVertical: isSmallScreen ? 8 : 10,
                    paddingHorizontal: 20,
                  },
                ]}
                onPress={() => handleNavigate(subItem.route)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.subMenuLabel,
                    {
                      color: theme.text,
                      fontSize: isSmallScreen ? 13 : 14,
                    },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {subItem.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const getRoleTitle = () => {
    switch (role) {
      case "admin":
        return "Admin Paneli";
      case "teacher":
        return "Öğretmen Paneli";
      case "parent":
        return "Veli Paneli";
      default:
        return "Panel";
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={menuVisible}
      onRequestClose={closeMenu}
    >
      <View style={styles.modalOverlay}>
        <RNAnimated.View
          style={[
            styles.slideMenu,
            {
              backgroundColor: theme.background,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View
            style={[styles.menuHeader, { borderBottomColor: theme.border }]}
          >
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.card }]}
              onPress={closeMenu}
            >
              <Text style={[styles.closeButtonText, { color: theme.text }]}>
                ✕
              </Text>
            </TouchableOpacity>

            <Image
              source={require("../../assets/logo.png")}
              style={styles.menuLogo}
              resizeMode="contain"
            />
            <Text style={[styles.menuTitle, { color: theme.text }]}>
              OKUL KOÇU
            </Text>
            <Text style={[styles.roleTitle, { color: theme.text }]}>
              {getRoleTitle()}
            </Text>
            {schoolCode && (
              <View
                style={[styles.schoolBadge, { backgroundColor: theme.accent }]}
              >
                <Text
                  style={[
                    styles.schoolText,
                    { color: isDark ? theme.background : theme.primary },
                  ]}
                >
                  🏫 {schoolCode}
                </Text>
              </View>
            )}
          </View>

          <FlatList
            data={getFlatMenuItems()}
            keyExtractor={(item) => item.key}
            renderItem={renderMenuItem}
            style={{ maxHeight: MAX_LIST_HEIGHT }}
            contentContainerStyle={{
              paddingVertical: 8,
              paddingBottom: 16,
            }}
            showsVerticalScrollIndicator={false}
            bounces={false}
          />

          <View style={styles.divider} />

          <View style={styles.logoutContainer}>
            <TouchableOpacity
              style={[
                styles.logoutButton,
                { 
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={[styles.logoutIcon, { backgroundColor: "#ff6b6b" }]}>
                <Ionicons name="log-out-outline" size={14} color="#fff" />
              </View>
              
              <Text
                style={[
                  styles.logoutText,
                  { color: "#ff6b6b" },
                ]}
              >
                Çıkış Yap
              </Text>
            </TouchableOpacity>
          </View>
          </SafeAreaView>
        </RNAnimated.View>

        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPress={closeMenu}
        />
      </View>
    </Modal>
  );
}

// Placeholder screen - moved from AppDrawer for completeness
export const PlaceholderScreen = ({ title }) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.placeholderContainer,
        { backgroundColor: theme.background },
      ]}
    >
      <Text style={[styles.placeholderText, { color: theme.text }]}>
        {title}
      </Text>
      <Text style={[styles.placeholderSubtext, { color: theme.text }]}>
        Bu özellik geliştirilecek
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: "row",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  slideMenu: {
    width: 280,
    paddingTop: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  menuHeader: {
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  closeButton: {
    alignSelf: "flex-end",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  menuLogo: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  roleTitle: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 5,
  },
  schoolBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
  schoolText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  categoryContainer: {
    marginBottom: 4,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    marginVertical: 1,
  },
  categoryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  expandIcon: {
    fontSize: 14,
    fontWeight: "bold",
  },
  subItemsContainer: {
    marginLeft: 8,
    marginTop: 2,
  },
  subMenuItem: {
    borderRadius: 8,
    marginVertical: 1,
    marginLeft: 8,
  },
  subMenuLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 8,
    marginHorizontal: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 2,
    marginHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 44,
  },
  menuIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontWeight: "500",
  },
  menuArrow: {
    opacity: 0.5,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 44,
  },
  logoutIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  logoutContainer: {
    paddingHorizontal: 10,
    paddingBottom: 30,
    paddingTop: 10,
    backgroundColor: "transparent",
  },
  spacer: {
    height: 20, // Add some space between menu items and the logout button
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  placeholderSubtext: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
});

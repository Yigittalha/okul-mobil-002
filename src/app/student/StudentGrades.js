import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../state/theme";
import { SessionContext } from "../../state/session";
import { useSlideMenu } from "../../navigation/SlideMenuContext";
import ThemeToggle from "../../ui/theme/ThemeToggle";
import api from "../../lib/api";

const StudentGrades = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { openMenu } = useSlideMenu();
  const { clearSession } = useContext(SessionContext);

  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);

  // Sayfa yükleme ve notları çekme
  useEffect(() => {
    fetchStudentGrades();
  }, []);

  const fetchStudentGrades = async () => {
    try {
      setLoading(true);

      // Önce öğrenci bilgilerini al
      console.log("🔍 Fetching user info for student grades");
      const userInfoResponse = await api.post("/user/info", {});
      
      if (!userInfoResponse?.data) {
        throw new Error("Kullanıcı bilgileri alınamadı");
      }

      const userInfo = userInfoResponse.data;
      setStudentInfo(userInfo);
      
      console.log("👤 User info received:", userInfo);
      console.log("🔍 Fetching student grades for OgrenciId:", userInfo.OgrenciId);

      // Öğrenci notlarını al
      const response = await api.post("/student/point", {
        OgrenciId: userInfo.OgrenciId,
      });

      console.log("📡 Student grades API Response received:", response.status);

      if (response?.data) {
        console.log("✅ Student grades fetched successfully!");
        console.log("📋 Found", response.data.length, "grade items");
        
        // Tarihe göre sırala (en yeni en üstte)
        const sortedGrades = response.data.sort((a, b) => 
          new Date(b.Tarih) - new Date(a.Tarih)
        );
        
        setGrades(sortedGrades);
      } else {
        console.log("⚠️ No grade data returned");
        setGrades([]);
      }
    } catch (error) {
      console.error("❌ Error fetching student grades:", error);
      Alert.alert(
        "Hata",
        "Notlar yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.",
        [{ text: "Tamam" }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStudentGrades();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Belirtilmemiş";
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  const getGradeColor = (grade) => {
    const numericGrade = parseFloat(grade);
    if (numericGrade >= 85) return "#34C759"; // Yeşil - Mükemmel
    if (numericGrade >= 70) return "#007AFF"; // Mavi - İyi
    if (numericGrade >= 60) return "#FF9500"; // Turuncu - Orta
    if (numericGrade >= 45) return "#FF3B30"; // Kırmızı - Zayıf
    return "#8E8E93"; // Gri - Çok zayıf
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar 
          barStyle={isDark ? "light-content" : "dark-content"} 
          backgroundColor={isDark ? "#0D1B2A" : "#f8f9fa"} 
        />
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color="#FFD60A" />
          <Text style={[styles.loadingText, { color: theme.text, marginTop: 16 }]}>
            Notlarınız yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={isDark ? "#0D1B2A" : "#f8f9fa"} 
      />
      
      {/* Custom Navbar */}
      <View style={[styles.navbar, { 
        backgroundColor: isDark ? "#0D1B2A" : "#f8f9fa",
        borderBottomColor: isDark ? "rgba(255, 214, 10, 0.2)" : "#e9ecef"
      }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { 
            color: isDark ? "#FFD60A" : "#0D1B2A" 
          }]}>
            ← Geri
          </Text>
        </TouchableOpacity>

        <Text style={[styles.navbarTitle, { 
          color: isDark ? "#FFD60A" : "#0D1B2A" 
        }]}>
          Notlarım
        </Text>

        <ThemeToggle />
      </View>

      {/* Student Info Card */}
      {studentInfo && (
        <View style={[styles.studentInfoCard, { 
          backgroundColor: isDark ? "#FFD60A" : "#0D1B2A"
        }]}>
          <Text style={[styles.studentInfoTitle, { 
            color: isDark ? "#0D1B2A" : "#FFD60A" 
          }]}>
            {studentInfo.AdSoyad}
          </Text>
          <Text style={[styles.studentInfoSubtitle, { 
            color: isDark ? "#0D1B2A" : "#FFD60A" 
          }]}>
            Öğrenci No: {studentInfo.OgrenciNumara} • Sınıf: {studentInfo.Sinif}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#FFD60A"]}
            tintColor="#FFD60A"
          />
        }
      >
        {grades.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateIcon, { color: "#FFD60A" }]}>
              📊
            </Text>
            <Text style={[styles.emptyStateText, { 
              color: isDark ? "#999" : "#666" 
            }]}>
              Henüz not bulunmuyor
            </Text>
            <Text style={[styles.emptyStateSubtext, { 
              color: isDark ? "#7C8DA6" : "#888" 
            }]}>
              Notlarınız burada görünecek
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.gradesHeader}>
              <Text style={[styles.gradesHeaderText, { color: theme.text }]}>
                Toplam {grades.length} not
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}
                disabled={refreshing}
              >
                <Text style={[styles.refreshIcon, { color: "#333" }]}>
                  {refreshing ? "⟳" : "↻"}
                </Text>
              </TouchableOpacity>
            </View>

            {grades.map((grade, index) => (
              <View key={index} style={[styles.gradeCard, { 
                backgroundColor: theme.card,
                borderColor: isDark ? "rgba(255, 214, 10, 0.2)" : "#e9ecef"
              }]}>
                <View style={styles.gradeHeader}>
                  <View style={styles.gradeInfo}>
                    <Text style={[styles.subjectText, { 
                      color: isDark ? "#E6EDF3" : "#333" 
                    }]}>
                      📚 {grade.Ders}
                    </Text>
                    <Text style={[styles.examText, { 
                      color: isDark ? "#7C8DA6" : "#666" 
                    }]}>
                      {grade.SinavAdi}
                    </Text>
                  </View>
                  
                  <View style={[styles.gradeBadge, { 
                    backgroundColor: getGradeColor(grade.puan) + "20"
                  }]}>
                    <Text style={[styles.gradePoints, { 
                      color: getGradeColor(grade.puan)
                    }]}>
                      {grade.puan}
                    </Text>
                  </View>
                </View>

                <View style={styles.gradeDetails}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { 
                      color: isDark ? "#7C8DA6" : "#666" 
                    }]}>
                      Öğrenci:
                    </Text>
                    <Text style={[styles.detailValue, { 
                      color: isDark ? "#E6EDF3" : "#333" 
                    }]}>
                      {grade.AdSoyad} ({grade.OgrenciNumara})
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { 
                      color: isDark ? "#7C8DA6" : "#666" 
                    }]}>
                      Tarih:
                    </Text>
                    <Text style={[styles.detailValue, { 
                      color: isDark ? "#E6EDF3" : "#333" 
                    }]}>
                      {formatDate(grade.Tarih)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  navbarTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  studentInfoCard: {
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  studentInfoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  studentInfoSubtitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  gradesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  gradesHeaderText: {
    fontSize: 16,
    fontWeight: "600",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
  },
  refreshIcon: {
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  gradeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  gradeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  gradeInfo: {
    flex: 1,
  },
  subjectText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  examText: {
    fontSize: 14,
    fontWeight: "500",
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 50,
    alignItems: "center",
  },
  gradePoints: {
    fontSize: 16,
    fontWeight: "bold",
  },
  gradeDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
});

export default StudentGrades;

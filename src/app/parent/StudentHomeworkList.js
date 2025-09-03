import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../../lib/api";
import { SessionContext } from "../../state/session";
import { useTheme } from "../../state/theme";

import ThemeToggle from "../../ui/theme/ThemeToggle";
import RefreshableScrollView from "../../components/RefreshableScrollView";

const StudentHomeworkList = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { studentInfo: passedStudentInfo } = route.params || {};
  const { schoolCode, clearSession } = useContext(SessionContext);
  const { theme, isDark, toggleTheme } = useTheme();

  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [studentInfo, setStudentInfo] = useState(passedStudentInfo);

  // Fetch data only once on mount
  useEffect(() => {
    fetchStudentHomework();
  }, []);

  const fetchStudentHomework = async () => {
    try {
      setLoading(true);
      setError(null);

      // Önce geçirilen öğrenci bilgilerini kontrol et
      if (passedStudentInfo && passedStudentInfo.OgrenciId) {
        setStudentInfo(passedStudentInfo);

        // Ödev listesini al
        const homeworkData = await api.post("/student/homework", {
          OgrenciID: passedStudentInfo.OgrenciId,
          Sinif: passedStudentInfo.Sinif || "",
        });

        if (homeworkData?.data) {
          // Ödevleri verilme tarihine göre sırala (en yeni üstte)
          const sortedHomework = homeworkData.data.sort((a, b) => {
            const dateA = new Date(a.tarih);
            const dateB = new Date(b.tarih);
            return dateB - dateA; // En yeni tarih üstte
          });

          setHomeworkList(sortedHomework);
        } else {
          setHomeworkList([]);
        }
        return;
      }

      // Kullanıcı bilgilerini al (OgrenciID ve Sinif dahil)
      const userResponse = await api.post("/user/info", {});

      if (userResponse?.data) {
        if (userResponse.data.OgrenciId) {
          setStudentInfo(userResponse.data);

          // Ödev listesini al
          const homeworkData = await api.post("/student/homework", {
            OgrenciID: userResponse.data.OgrenciId,
            Sinif: userResponse.data.Sinif || "",
          });

          if (homeworkData?.data) {
            // Ödevleri verilme tarihine göre sırala (en yeni üstte)
            const sortedHomework = homeworkData.data.sort((a, b) => {
              const dateA = new Date(a.tarih);
              const dateB = new Date(b.tarih);
              return dateB - dateA; // En yeni tarih üstte
            });

            setHomeworkList(sortedHomework);
          } else {
            setHomeworkList([]);
          }
        } else {
          setError("Öğrenci ID bilgisi bulunamadı. Lütfen tekrar giriş yapın.");

          // Oturumu sonlandır
          setTimeout(() => {
            clearSession();
          }, 2000);
        }
      } else {
        setError("Kullanıcı bilgileri alınamadı. Lütfen tekrar giriş yapın.");

        // Oturumu sonlandır
        setTimeout(() => {
          clearSession();
        }, 2000);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        clearSession();
        navigation.navigate("Login");
      } else {
        setError("Ödev listesi alınırken bir hata oluştu: " + error.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStudentHomework();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Belirtilmemiş";
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  // Teslim tarihine kalan günleri hesapla
  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    
    const today = new Date();
    const due = new Date(dueDate);
    
    // Sadece tarihi karşılaştır (saat, dakika, saniye hariç)
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Kalan gün durumuna göre renk ve mesaj
  const getDaysRemainingInfo = (daysRemaining) => {
    if (daysRemaining === null) return null;
    
    if (daysRemaining < 0) {
      return {
        text: `${Math.abs(daysRemaining)} gün gecikti`,
        color: "#FF3B30",
        bgColor: "rgba(255, 59, 48, 0.1)",
        icon: "⚠️"
      };
    } else if (daysRemaining === 0) {
      return {
        text: "Bugün son gün!",
        color: "#FF9500",
        bgColor: "rgba(255, 149, 0, 0.1)",
        icon: "⏰"
      };
    } else if (daysRemaining === 1) {
      return {
        text: "Yarın son gün",
        color: "#FF9500",
        bgColor: "rgba(255, 149, 0, 0.1)",
        icon: "📅"
      };
    } else if (daysRemaining <= 3) {
      return {
        text: `${daysRemaining} gün kaldı`,
        color: "#FF9500",
        bgColor: "rgba(255, 149, 0, 0.1)",
        icon: "📅"
      };
    } else if (daysRemaining <= 7) {
      return {
        text: `${daysRemaining} gün kaldı`,
        color: "#34C759",
        bgColor: "rgba(52, 199, 89, 0.1)",
        icon: "✅"
      };
    } else {
      return {
        text: `${daysRemaining} gün kaldı`,
        color: "#007AFF",
        bgColor: "rgba(0, 122, 255, 0.1)",
        icon: "📚"
      };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return "Bekliyor";
      case 1:
        return "Tamamlandı";
      case 2:
        return "Gecikti";
      default:
        return "Bilinmiyor";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 0:
        return theme.warning;
      case 1:
        return theme.success;
      case 2:
        return theme.danger;
      default:
        return theme.muted;
    }
  };

  const getHomeworkTypeText = (kayitTuru) => {
    return kayitTuru === 1 ? "Öğrenciye Özel" : "Sınıfa Genel";
  };

  const isOverdue = (homework) => {
    if (!homework.TeslimTarihi) return false;
    const dueDate = new Date(homework.TeslimTarihi);
    const today = new Date();
    return dueDate < today && homework.durum !== 1; // Tamamlanmamış ve gecikmiş
  };

  const navigateToDetail = (homework) => {
    navigation.navigate("StudentHomeworkDetail", { homework });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
                  <TouchableOpacity style={styles.menuButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.menuIcon, { color: theme.text }]}>←</Text>
        </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Ödevlerim
          </Text>
          <ThemeToggle />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Ödevler yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.menuIcon, { color: theme.text }]}>←</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Ödevlerim
        </Text>

        <ThemeToggle />
      </View>

      <RefreshableScrollView
        onRefresh={handleRefresh}
        refreshing={refreshing}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {error ? (
          <View style={[styles.errorCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.errorText, { color: theme.danger }]}>
              ❌ {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.accent }]}
              onPress={fetchStudentHomework}
            >
              <Text style={[styles.retryButtonText, { color: "#fff" }]}>
                Tekrar Dene
              </Text>
            </TouchableOpacity>
          </View>
        ) : homeworkList.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.emptyText, { color: theme.muted }]}>
              📚 Henüz ödev bulunmuyor
            </Text>
          </View>
        ) : (
          homeworkList.map((homework, index) => (
            <TouchableOpacity
              key={homework.id || index}
              style={[
                styles.homeworkCard,
                {
                  backgroundColor: theme.card,
                  borderLeftWidth: isOverdue(homework) ? 4 : 0,
                  borderLeftColor: isOverdue(homework)
                    ? theme.danger
                    : "transparent",
                },
              ]}
              onPress={() => navigateToDetail(homework)}
            >
              <View style={styles.homeworkHeader}>
                <View style={styles.subjectContainer}>
                  <Text
                    style={[
                      styles.subjectText,
                      {
                        color: isOverdue(homework) ? theme.danger : theme.text,
                      },
                    ]}
                  >
                    📖 {homework.DersAdi}
                  </Text>
                  <Text
                    style={[styles.topicText, { color: theme.textSecondary }]}
                  >
                    {homework.Konu}
                  </Text>
                </View>
                <View style={styles.statusContainer}>
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(homework.durum) },
                    ]}
                  >
                    {getStatusText(homework.durum)}
                  </Text>
                  <Text style={[styles.typeText, { color: theme.muted }]}>
                    {getHomeworkTypeText(homework.KayitTuru)}
                  </Text>
                </View>
              </View>

              <Text
                style={[styles.descriptionText, { color: theme.textSecondary }]}
              >
                {homework.Aciklama}
              </Text>

              <View style={styles.homeworkFooter}>
                <View style={styles.dateContainer}>
                  <Text style={[styles.dateLabel, { color: theme.muted }]}>
                    Teslim Tarihi:
                  </Text>
                  <View style={styles.dateRow}>
                    <Text
                      style={[
                        styles.dateText,
                        {
                          color: isOverdue(homework) ? theme.danger : theme.text,
                        },
                      ]}
                    >
                      {formatDate(homework.TeslimTarihi)}
                      {isOverdue(homework) && " ⚠️"}
                    </Text>

                    {/* Kalan gün bilgisi */}
                    {(() => {
                      const daysRemaining = getDaysRemaining(homework.TeslimTarihi);
                      const dayInfo = getDaysRemainingInfo(daysRemaining);
                      
                      if (dayInfo && homework.durum !== 1) { // Tamamlanmamış ödevler için göster
                        return (
                          <View style={[
                            styles.daysRemainingBadge, 
                            { backgroundColor: dayInfo.bgColor }
                          ]}>
                            <Text style={styles.daysRemainingIcon}>
                              {dayInfo.icon}
                            </Text>
                            <Text style={[
                              styles.daysRemainingText, 
                              { color: dayInfo.color }
                            ]}>
                              {dayInfo.text}
                            </Text>
                          </View>
                        );
                      }
                      return null;
                    })()}

                  </View>
                </View>

                {homework.Fotograf && (
                  <View style={styles.photoIndicator}>
                    <Text style={[styles.photoText, { color: theme.accent }]}>
                      📷 Fotoğraf Var
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </RefreshableScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  menuButton: {
    padding: 10,
  },
  menuIcon: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyCard: {
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  homeworkCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  homeworkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  subjectContainer: {
    flex: 1,
  },
  subjectText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  topicText: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  typeText: {
    fontSize: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  homeworkFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
  },
  daysRemainingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  daysRemainingIcon: {
    fontSize: 12,
  },
  daysRemainingText: {
    fontSize: 12,
    fontWeight: "600",
  },
  photoIndicator: {
    alignItems: "flex-end",
  },
  photoText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default StudentHomeworkList;

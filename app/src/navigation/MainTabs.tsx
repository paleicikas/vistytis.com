import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../AppState";
import CollectionScreen from "../screens/CollectionScreen";
import InfoScreen from "../screens/InfoScreen";
import PlacesScreen from "../screens/PlacesScreen";
import { translate } from "../i18n";
import { colors } from "../theme";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  const { locale } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarActiveBackgroundColor: colors.primaryLight,
        tabBarShowLabel: true,
        tabBarStyle: {
          height: 68 + insets.bottom,
          paddingTop: 4,
          paddingBottom: 4 + insets.bottom,
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
        },
        tabBarItemStyle: {
          marginHorizontal: 8,
          marginVertical: 0,
          borderRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          lineHeight: 16,
          fontWeight: "700",
        },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            color={color}
            name={
              route.name === "Collection"
                ? focused
                  ? "ribbon"
                  : "ribbon-outline"
                : route.name === "Info"
                  ? focused
                    ? "information-circle"
                    : "information-circle-outline"
                : focused
                  ? "map"
                  : "map-outline"
            }
            size={size}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Places"
        component={PlacesScreen}
        options={{ title: translate(locale, "nav.places") }}
      />
      <Tab.Screen
        name="Collection"
        component={CollectionScreen}
        options={{ title: translate(locale, "nav.collection") }}
      />
      <Tab.Screen
        name="Info"
        component={InfoScreen}
        options={{ title: translate(locale, "nav.info") }}
      />
    </Tab.Navigator>
  );
}

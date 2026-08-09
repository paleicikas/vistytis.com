import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../AppState";
import CollectionScreen from "../screens/CollectionScreen";
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
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 74 + insets.bottom,
          paddingTop: 8,
          paddingBottom: 12 + insets.bottom,
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            color={color}
            name={route.name === "Collection" ? "ribbon-outline" : "map-outline"}
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
    </Tab.Navigator>
  );
}

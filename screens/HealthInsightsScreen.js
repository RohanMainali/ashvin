"use client"

import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "@react-navigation/native"
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Dimensions,
  StatusBar,
  Animated,
  ImageBackground
} from "react-native"
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import { Colors } from "../constants/colors"

const { width } = Dimensions.get('window')

const healthArticles = [
	{
		id: "1",
		title: "Understanding Body Health Metrics",
		summary: "Learn about key indicators like vitals, skin, and eye health, and what they mean for your well-being.",
		category: "Health Monitoring",
		icon: "pulse",
		gradient: ['#667eea', '#764ba2'],
		insights: [
			"Track vital signs regularly",
			"Monitor skin changes",
			"Check eye health indicators",
			"Understand normal ranges"
		],
		content: "Monitoring your body's health metrics goes beyond just heart rate. Key indicators include blood pressure, pulse, blood oxygen, temperature, and visual assessments of skin and eyes. Understanding these metrics can provide early warnings for potential issues or confirm good health."
	},
	{
		id: "2",
		title: "Holistic Wellness Journey",
		summary: "Discover how diet, exercise, stress management, and sleep contribute to overall health.",
		category: "Lifestyle",
		icon: "leaf",
		gradient: ['#f093fb', '#f5576c'],
		insights: [
			"Balance nutrition intake",
			"Regular physical activity",
			"Practice stress management",
			"Prioritize quality sleep"
		],
		content: "True health is a balance of physical, mental, and emotional well-being. A balanced diet rich in nutrients fuels your body, while regular exercise strengthens muscles, improves cardiovascular health, and boosts mood."
	},
	{
		id: "3",
		title: "AI-Powered Health Insights",
		summary: "Explore how AI assists in monitoring symptoms, understanding conditions, and personalized health management.",
		category: "Technology",
		icon: "hardware-chip",
		gradient: ['#4facfe', '#00f2fe'],
		insights: [
			"Personalized health analysis",
			"Pattern recognition",
			"Early warning systems",
			"Smart recommendations"
		],
		content: "Artificial Intelligence is revolutionizing personal health management by providing powerful tools for monitoring, analysis, and guidance. AI-powered systems can help interpret scan results and offer personalized insights."
	},
	{
		id: "4",
		title: "Mental Health & Mindfulness",
		summary: "Essential practices for maintaining psychological well-being and emotional balance.",
		category: "Mental Health",
		icon: "heart",
		gradient: ['#fa709a', '#fee140'],
		insights: [
			"Practice daily meditation",
			"Recognize stress signals",
			"Build emotional resilience",
			"Seek support when needed"
		],
		content: "Mental health is just as important as physical health. Regular mindfulness practices, stress management techniques, and emotional awareness contribute significantly to overall well-being and quality of life."
	}
]

const healthStats = [
	{ icon: "pulse", label: "Vitals Tracked", value: "1,247", color: "#667eea" },
	{ icon: "eye", label: "Scans Completed", value: "89", color: "#f093fb" },
	{ icon: "time", label: "Hours Monitored", value: "156", color: "#4facfe" },
	{ icon: "trending-up", label: "Health Score", value: "94%", color: "#fa709a" }
]

const HealthInsightsScreen = ({ navigation }) => {
	const { colors } = useTheme()
	const [selectedCategory, setSelectedCategory] = useState('All')
	const scrollY = useRef(new Animated.Value(0)).current
	const fadeAnim = useRef(new Animated.Value(0)).current
	const scaleAnim = useRef(new Animated.Value(0.9)).current

	const categories = ['All', 'Health Monitoring', 'Lifestyle', 'Technology', 'Mental Health']

	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 1000,
				useNativeDriver: true,
			}),
			Animated.spring(scaleAnim, {
				toValue: 1,
				tension: 100,
				friction: 8,
				useNativeDriver: true,
			})
		]).start()
	}, [])

	const filteredArticles = selectedCategory === 'All' 
		? healthArticles 
		: healthArticles.filter(article => article.category === selectedCategory)

	const StatCard = ({ stat, index, colors }) => (
		<Animated.View 
			style={[
				styles.statCard,
				{ backgroundColor: colors.card },
				{
					transform: [{
						translateY: scrollY.interpolate({
							inputRange: [0, 100],
							outputRange: [0, -10 * (index + 1)],
							extrapolate: 'clamp',
						})
					}]
				}
			]}
		>
			<View style={[styles.statIconContainer, { backgroundColor: stat.color + '20' }]}>
				<Ionicons name={stat.icon} size={24} color={stat.color} />
			</View>
			<Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
			<Text style={[styles.statLabel, { color: colors.text }]}>{stat.label}</Text>
		</Animated.View>
	)

	const ArticleCard = ({ article, index, colors }) => (
		<Animated.View 
			style={[
				styles.articleCard,
				{ backgroundColor: colors.card },
				{
					opacity: fadeAnim,
					transform: [
						{ scale: scaleAnim },
						{
							translateY: scrollY.interpolate({
								inputRange: [0, 100],
								outputRange: [0, -5 * index],
								extrapolate: 'clamp',
							})
						}
					]
				}
			]}
		>
			{/* Header */}
			<View style={styles.articleHeader}>
				<LinearGradient
					colors={article.gradient}
					style={styles.articleIconContainer}
				>
					<Ionicons name={article.icon} size={24} color="white" />
				</LinearGradient>
				<View style={styles.articleHeaderText}>
					<Text style={[styles.articleCategory, { color: colors.text }]}>{article.category}</Text>
					<Text style={[styles.articleTitle, { color: colors.text }]}>{article.title}</Text>
				</View>
			</View>

			{/* Content */}
			<Text style={[styles.articleSummary, { color: colors.text }]}>{article.summary}</Text>

			{/* Insights */}
			<View style={styles.insightsContainer}>
				<Text style={[styles.insightsTitle, { color: colors.text }]}>Key Insights:</Text>
				{article.insights.map((insight, idx) => (
					<View key={idx} style={styles.insightItem}>
						<View style={[styles.insightDot, { backgroundColor: colors.text }]} />
						<Text style={[styles.insightText, { color: colors.text }]}>{insight}</Text>
					</View>
				))}
			</View>

			{/* Actions */}
			<View style={styles.articleActions}>
				<TouchableOpacity
					style={styles.learnMoreButton}
					onPress={() =>
						navigation.navigate("MainApp", {
							screen: "Chat",
							params: { initialPrompt: `Tell me more about: ${article.title}` },
						})
					}
				>
					<LinearGradient
						colors={article.gradient}
						style={styles.learnMoreGradient}
					>
						<Ionicons name="chatbubbles" size={18} color="white" />
						<Text style={styles.learnMoreText}>Ask Ashvin</Text>
					</LinearGradient>
				</TouchableOpacity>
				
				<TouchableOpacity 
					style={[styles.shareButton, { backgroundColor: colors.card }]}
					onPress={() => {/* Add share functionality */}}
				>
					<Ionicons name="share" size={20} color={colors.text} />
				</TouchableOpacity>
			</View>
		</Animated.View>
	)

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
			
			{/* Hero Section - Similar to HomeScreen */}
			<LinearGradient colors={[Colors.primary, Colors.gradientEnd]} style={styles.heroSection}>
				<View style={styles.header}>
					<TouchableOpacity
						style={styles.backButton}
						onPress={() => navigation.goBack()}
					>
						<Ionicons name="chevron-back" size={24} color={Colors.textLight} />
					</TouchableOpacity>
					<View style={styles.headerContent}>
						<Text style={styles.heroTitle}>Health Insights</Text>
						<Text style={styles.heroSubtitle}>Personalized wellness guidance</Text>
					</View>
					<TouchableOpacity style={styles.searchButton}>
						<Ionicons name="search" size={24} color={Colors.textLight} />
					</TouchableOpacity>
				</View>
			</LinearGradient>
			
			<Animated.ScrollView
				style={styles.scrollView}
				onScroll={Animated.event(
					[{ nativeEvent: { contentOffset: { y: scrollY } } }],
					{ useNativeDriver: false }
				)}
				scrollEventThrottle={16}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 100 }}
			>
				{/* Stats Overview */}
				<View style={styles.statsSection}>
					<Text style={[styles.sectionTitle, { color: colors.text }]}>Your Health Overview</Text>
					<ScrollView 
						horizontal 
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.statsContainer}
					>
						{healthStats.map((stat, index) => (
							<StatCard key={stat.label} stat={stat} index={index} colors={colors} />
						))}
					</ScrollView>
				</View>

				{/* Category Filter */}
				<View style={styles.filterSection}>
					<Text style={[styles.sectionTitle, { color: colors.text }]}>Explore Topics</Text>
					<ScrollView 
						horizontal 
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.categoriesContainer}
					>
						{categories.map((category) => (
							<TouchableOpacity
								key={category}
								style={[
									styles.categoryButton,
									{ backgroundColor: colors.card },
									selectedCategory === category && styles.categoryButtonActive
								]}
								onPress={() => setSelectedCategory(category)}
							>
								<Text style={[
									styles.categoryButtonText,
									{ color: colors.text },
									selectedCategory === category && styles.categoryButtonTextActive
								]}>
									{category}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Articles */}
				<View style={styles.articlesSection}>
					{filteredArticles.map((article, index) => (
						<ArticleCard key={article.id} article={article} index={index} colors={colors} />
					))}
				</View>

				{/* Quick Actions */}
				<View style={styles.quickActionsSection}>
					<View style={[styles.quickActionsCard, { backgroundColor: colors.card }]}>
						<View style={styles.quickActionsHeader}>
							<Ionicons name="bulb" size={28} color={Colors.primary} />
							<Text style={[styles.quickActionsTitle, { color: colors.text }]}>Need More Help?</Text>
						</View>
						<Text style={[styles.quickActionsText, { color: colors.text }]}>
							Get personalized insights and answers from our AI health assistant
						</Text>
						<TouchableOpacity
							style={[styles.chatButton, { backgroundColor: Colors.primary }]}
							onPress={() => navigation.navigate("Chat")}
						>
							<Ionicons name="chatbubble-ellipses" size={20} color={Colors.textLight} />
							<Text style={styles.chatButtonText}>Start Chat</Text>
							<Ionicons name="arrow-forward" size={18} color={Colors.textLight} />
						</TouchableOpacity>
					</View>
				</View>
			</Animated.ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	
	scrollView: {
		flex: 1,
	},

	// Hero Section - Similar to HomeScreen
	heroSection: {
		paddingHorizontal: 24,
		paddingTop: 40,
		paddingBottom: 32,
		borderBottomLeftRadius: 24,
		borderBottomRightRadius: 24,
		marginBottom: 24,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 8,
	},

	// Header Styles
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerContent: {
		flex: 1,
		alignItems: 'center',
		paddingHorizontal: 20,
	},
	heroTitle: {
		fontSize: 28,
		fontWeight: 'bold',
		color: Colors.textLight,
		textAlign: 'center',
		marginBottom: 8,
	},
	heroSubtitle: {
		fontSize: 16,
		color: Colors.textLight,
		textAlign: 'center',
		opacity: 0.9,
	},
	searchButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
	},

	// Stats Section
	statsSection: {
		marginBottom: 30,
		paddingHorizontal: 20,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 15,
	},
	statsContainer: {
		paddingHorizontal: 5,
		gap: 15,
	},
	statCard: {
		width: 140,
		height: 120,
		padding: 15,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	statIconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 8,
	},
	statValue: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	statLabel: {
		fontSize: 12,
		textAlign: 'center',
		opacity: 0.7,
	},

	// Filter Section
	filterSection: {
		marginBottom: 25,
		paddingHorizontal: 20,
	},
	categoriesContainer: {
		paddingHorizontal: 5,
		gap: 10,
	},
	categoryButton: {
		borderRadius: 25,
		paddingHorizontal: 20,
		paddingVertical: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	categoryButtonActive: {
		backgroundColor: Colors.primary,
	},
	categoryButtonText: {
		fontSize: 14,
		fontWeight: '500',
		opacity: 0.7,
	},
	categoryButtonTextActive: {
		color: Colors.textLight,
		fontWeight: 'bold',
		opacity: 1,
	},

	// Articles Section
	articlesSection: {
		paddingHorizontal: 20,
		gap: 20,
		marginBottom: 30,
	},
	articleCard: {
		borderRadius: 20,
		padding: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 6,
	},
	articleHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 15,
	},
	articleIconContainer: {
		width: 50,
		height: 50,
		borderRadius: 25,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 15,
	},
	articleHeaderText: {
		flex: 1,
	},
	articleCategory: {
		fontSize: 12,
		fontWeight: '600',
		marginBottom: 4,
		textTransform: 'uppercase',
		letterSpacing: 1,
		opacity: 0.7,
	},
	articleTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		lineHeight: 24,
	},
	articleSummary: {
		fontSize: 15,
		lineHeight: 22,
		marginBottom: 20,
		opacity: 0.8,
	},

	// Insights
	insightsContainer: {
		marginBottom: 20,
	},
	insightsTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 12,
	},
	insightItem: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	insightDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		marginRight: 12,
		opacity: 0.6,
	},
	insightText: {
		fontSize: 14,
		flex: 1,
		opacity: 0.8,
	},

	// Article Actions
	articleActions: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	learnMoreButton: {
		flex: 1,
		borderRadius: 25,
		overflow: 'hidden',
		marginRight: 10,
	},
	learnMoreGradient: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		paddingHorizontal: 20,
		gap: 8,
	},
	learnMoreText: {
		fontSize: 15,
		fontWeight: '600',
		color: 'white',
	},
	shareButton: {
		width: 45,
		height: 45,
		borderRadius: 22.5,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},

	// Quick Actions
	quickActionsSection: {
		paddingHorizontal: 20,
		marginBottom: 40,
	},
	quickActionsCard: {
		padding: 25,
		borderRadius: 20,
		alignItems: 'center',
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 6,
	},
	quickActionsHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 15,
		gap: 10,
	},
	quickActionsTitle: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	quickActionsText: {
		fontSize: 15,
		textAlign: 'center',
		marginBottom: 20,
		lineHeight: 22,
		opacity: 0.8,
	},
	chatButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 15,
		paddingHorizontal: 25,
		borderRadius: 30,
		gap: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	chatButtonText: {
		fontSize: 16,
		fontWeight: 'bold',
		color: Colors.textLight,
	},
})

export default HealthInsightsScreen

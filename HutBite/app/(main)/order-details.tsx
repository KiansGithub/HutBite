import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Themed';
import { getMostRecentOrder } from '@/services/orderDatabaseService';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';

interface OrderDetailsData {
  id: number;
  order_id: string;
  user_id: string | null;
  restaurant_id: string;
  store_id: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  service_type: 'delivery' | 'collection';
  total_amount: number;
  currency: string;
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone: string;
  customer_address: string | null;
  customer_postal_code: string | null;
  customer_city: string | null;
  payment_method: string;
  payment_id: string | null;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  expected_time: string | null;
  confirmed_time: string | null;
  item_count: number;
  order_data: any;
  created_at: string;
  updated_at: string;
}

export default function OrderDetailsScreen() {
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<OrderDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMostRecentOrder();
  }, []);

  const loadMostRecentOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get most recent order (for MVP, we'll get the most recent regardless of user for testing)
      const result = await getMostRecentOrder(user?.id);

      if (result.success && result.order) {
        setOrder(result.order);
      } else {
        setError(result.error || 'No orders found');
      }
    } catch (err) {
      console.error('Error loading order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'preparing':
        return Colors.light.primary;
      case 'ready':
        return '#FF9500';
      case 'delivered':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order Pending';
      case 'confirmed':
        return 'Order Confirmed';
      case 'preparing':
        return 'Being Prepared';
      case 'ready':
        return 'Ready for Pickup/Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="receipt-outline" size={64} color="#8E8E93" />
          <Text style={styles.errorTitle}>No Order Found</Text>
          <Text style={styles.errorText}>
            {error || 'No recent orders to display'}
          </Text>
          <Button mode="contained" onPress={() => router.replace('/feed')} style={styles.backToFeedButton}>
            Back to Feed
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
      <StatusBar backgroundColor="transparent" translucent />

      {/* Header */}
      <LinearGradient
        colors={[Colors.light.primaryStart, Colors.light.primaryEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientHeader, { paddingTop: insets.top + 6 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <Ionicons name="chevron-back" size={22} color="#111" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Order Details</Text>
            <Text style={styles.headerSubtitle}>Order #{order.order_id.slice(-8)}</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(order.status) }]} />
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
          <Text style={styles.orderDate}>
            Placed on {formatDate(order.created_at)}
          </Text>
        </View>

        {/* Restaurant Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="restaurant-outline" size={20} color={Colors.light.primary} />
            <Text style={styles.cardTitle}>Restaurant</Text>
          </View>
          <Text style={styles.restaurantName}>Store ID: {order.store_id}</Text>
          <Text style={styles.serviceType}>
            {order.service_type === 'delivery' ? '🚚 Delivery' : '🏪 Collection'}
          </Text>
        </View>

        {/* Customer Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={20} color={Colors.light.primary} />
            <Text style={styles.cardTitle}>Customer Details</Text>
          </View>
          <Text style={styles.customerName}>
            {order.customer_first_name} {order.customer_last_name}
          </Text>
          <Text style={styles.customerDetail}>{order.customer_email}</Text>
          <Text style={styles.customerDetail}>{order.customer_phone}</Text>
          {order.customer_address && (
            <Text style={styles.customerDetail}>
              {order.customer_address}
              {order.customer_city && `, ${order.customer_city}`}
              {order.customer_postal_code && ` ${order.customer_postal_code}`}
            </Text>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="list-outline" size={20} color={Colors.light.primary} />
            <Text style={styles.cardTitle}>Order Items ({order.item_count})</Text>
          </View>
          
          {order.order_data?.items?.map((item: any, index: number) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>{item.price}</Text>
              </View>
              <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
              
              {/* Options */}
              {item.options && item.options.length > 0 && (
                <View style={styles.itemOptions}>
                  {item.options.map((option: any, optIndex: number) => (
                    <Text key={optIndex} style={styles.optionText}>
                      • {option.name} (+{option.price})
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Payment Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="card-outline" size={20} color={Colors.light.primary} />
            <Text style={styles.cardTitle}>Payment</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Method:</Text>
            <Text style={styles.paymentValue}>{order.payment_method}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Status:</Text>
            <Text style={[styles.paymentValue, { 
              color: order.payment_status === 'completed' ? '#34C759' : '#FF9500' 
            }]}>
              {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Total:</Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(order.total_amount, order.currency)}
            </Text>
          </View>
        </View>

        {/* Order Timeline */}
        {order.expected_time && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="time-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.cardTitle}>Timeline</Text>
            </View>
            <Text style={styles.timelineText}>
              Expected: {order.expected_time}
            </Text>
            {order.confirmed_time && (
              <Text style={styles.timelineText}>
                Confirmed: {formatDate(order.confirmed_time)}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          mode="outlined"
          onPress={() => router.replace('/feed')}
          style={styles.secondaryButton}
          labelStyle={styles.secondaryButtonText}
        >
          Back to Feed
        </Button>

        <Button
          mode="contained"
          onPress={loadMostRecentOrder}
          style={styles.primaryButton}
          labelStyle={styles.primaryButtonText}
        >
          Refresh
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  gradientHeader: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerIcon: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(17,17,17,0.08)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  headerSpacer: {
    height: 36,
    width: 36,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.text,
    opacity: 0.7,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.text,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
  },
  backToFeedButton: {
    backgroundColor: Colors.light.primary,
  },
  statusCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  orderDate: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.7,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  customerDetail: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.8,
    marginBottom: 2,
  },
  orderItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    flex: 1,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  itemQuantity: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.8,
    marginBottom: 4,
  },
  itemOptions: {
    marginTop: 4,
  },
  optionText: {
    fontSize: 13,
    color: Colors.light.text,
    opacity: 0.7,
    marginLeft: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.8,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  timelineText: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.8,
    marginBottom: 4,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderColor: Colors.light.primary,
  },
  secondaryButtonText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerRight: {
    width: 40,
  },
});

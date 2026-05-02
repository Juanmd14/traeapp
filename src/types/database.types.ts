export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          apartment: string | null
          city: string
          created_at: string
          id: string
          is_default: boolean
          label: string | null
          lat: number | null
          lng: number | null
          neighborhood: string | null
          number: string | null
          profile_id: string
          reference: string | null
          street: string
        }
        Insert: {
          apartment?: string | null
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          lat?: number | null
          lng?: number | null
          neighborhood?: string | null
          number?: string | null
          profile_id: string
          reference?: string | null
          street: string
        }
        Update: {
          apartment?: string | null
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          lat?: number | null
          lng?: number | null
          neighborhood?: string | null
          number?: string | null
          profile_id?: string
          reference?: string | null
          street?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          created_at: string
          diff: Json | null
          entity: string
          entity_id: string | null
          id: number
          ip: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          diff?: Json | null
          entity: string
          entity_id?: string | null
          id?: number
          ip?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          diff?: Json | null
          entity?: string
          entity_id?: string | null
          id?: number
          ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          id: string
          modifiers_json: Json
          notes: string | null
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          cart_id: string
          id?: string
          modifiers_json?: Json
          notes?: string | null
          product_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          cart_id?: string
          id?: string
          modifiers_json?: Json
          notes?: string | null
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          id: string
          local_id: string
          nombre: string
          orden: number | null
        }
        Insert: {
          id?: string
          local_id: string
          nombre: string
          orden?: number | null
        }
        Update: {
          id?: string
          local_id?: string
          nombre?: string
          orden?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          bg_class: string | null
          emoji: string | null
          icon_url: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          bg_class?: string | null
          emoji?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          bg_class?: string | null
          emoji?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      clientes: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nombre: string
          telefono: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          nombre: string
          telefono?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nombre?: string
          telefono?: string | null
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          assigned_at: string | null
          delivered_at: string | null
          distance_km: number | null
          driver_id: string | null
          driver_payout: number | null
          dropoff_lat: number | null
          dropoff_lng: number | null
          duration_minutes: number | null
          id: string
          notes: string | null
          order_id: string
          picked_up_at: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          status: Database["public"]["Enums"]["delivery_status"]
        }
        Insert: {
          assigned_at?: string | null
          delivered_at?: string | null
          distance_km?: number | null
          driver_id?: string | null
          driver_payout?: number | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          order_id: string
          picked_up_at?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          status?: Database["public"]["Enums"]["delivery_status"]
        }
        Update: {
          assigned_at?: string | null
          delivered_at?: string | null
          distance_km?: number | null
          driver_id?: string | null
          driver_payout?: number | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          order_id?: string
          picked_up_at?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          status?: Database["public"]["Enums"]["delivery_status"]
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_tracking: {
        Row: {
          delivery_id: string
          id: number
          lat: number
          lng: number
          recorded_at: string
          speed_kmh: number | null
        }
        Insert: {
          delivery_id: string
          id?: number
          lat: number
          lng: number
          recorded_at?: string
          speed_kmh?: number | null
        }
        Update: {
          delivery_id?: string
          id?: number
          lat?: number
          lng?: number
          recorded_at?: string
          speed_kmh?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_tracking_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      detalle_pedido: {
        Row: {
          cantidad: number
          id: string
          notas: string | null
          pedido_id: string
          precio_unitario: number
          producto_id: string
          subtotal: number | null
        }
        Insert: {
          cantidad: number
          id?: string
          notas?: string | null
          pedido_id: string
          precio_unitario: number
          producto_id: string
          subtotal?: number | null
        }
        Update: {
          cantidad?: number
          id?: string
          notas?: string | null
          pedido_id?: string
          precio_unitario?: number
          producto_id?: string
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "detalle_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_pedido_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      direcciones: {
        Row: {
          barrio: string | null
          calle: string
          ciudad: string
          cliente_id: string
          created_at: string | null
          depto: string | null
          id: string
          numero: string
          piso: string | null
          referencia: string | null
        }
        Insert: {
          barrio?: string | null
          calle: string
          ciudad?: string
          cliente_id: string
          created_at?: string | null
          depto?: string | null
          id?: string
          numero: string
          piso?: string | null
          referencia?: string | null
        }
        Update: {
          barrio?: string | null
          calle?: string
          ciudad?: string
          cliente_id?: string
          created_at?: string | null
          depto?: string | null
          id?: string
          numero?: string
          piso?: string | null
          referencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direcciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_status: {
        Row: {
          active_order_id: string | null
          current_lat: number | null
          current_lng: number | null
          driver_id: string
          is_online: boolean
          last_seen_at: string
        }
        Insert: {
          active_order_id?: string | null
          current_lat?: number | null
          current_lng?: number | null
          driver_id: string
          is_online?: boolean
          last_seen_at?: string
        }
        Update: {
          active_order_id?: string | null
          current_lat?: number | null
          current_lng?: number | null
          driver_id?: string
          is_online?: boolean
          last_seen_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_status_active_order_id_fkey"
            columns: ["active_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_status_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          product_id: string
          quantity: number
          track_inventory: boolean
        }
        Insert: {
          product_id: string
          quantity?: number
          track_inventory?: boolean
        }
        Update: {
          product_id?: string
          quantity?: number
          track_inventory?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      locales: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          direccion: string
          email: string | null
          id: string
          logo_url: string | null
          nombre: string
          telefono: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          direccion: string
          email?: string | null
          id?: string
          logo_url?: string | null
          nombre: string
          telefono?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          direccion?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          nombre?: string
          telefono?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          data: Json | null
          id: string
          read_at: string | null
          sent_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          sent_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          sent_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          modifiers_json: Json
          notes: string | null
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          id?: string
          modifiers_json?: Json
          notes?: string | null
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          total: number
          unit_price: number
        }
        Update: {
          id?: string
          modifiers_json?: Json
          notes?: string | null
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancel_reason: string | null
          cancelled_by: string | null
          commission_amount: number
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          customer_id: string
          customer_notes: string | null
          delivered_at: string | null
          delivery_address_id: string | null
          delivery_address_text: string
          delivery_fee: number
          delivery_lat: number | null
          delivery_lng: number | null
          discount: number
          driver_id: string | null
          estimated_delivery_at: string | null
          estimated_ready_at: string | null
          id: string
          order_number: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          picked_up_at: string | null
          promotion_id: string | null
          ready_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_by?: string | null
          commission_amount?: number
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_id: string
          customer_notes?: string | null
          delivered_at?: string | null
          delivery_address_id?: string | null
          delivery_address_text: string
          delivery_fee?: number
          delivery_lat?: number | null
          delivery_lng?: number | null
          discount?: number
          driver_id?: string | null
          estimated_delivery_at?: string | null
          estimated_ready_at?: string | null
          id?: string
          order_number?: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          picked_up_at?: string | null
          promotion_id?: string | null
          ready_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal: number
          total: number
          updated_at?: string
        }
        Update: {
          cancel_reason?: string | null
          cancelled_by?: string | null
          commission_amount?: number
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_id?: string
          customer_notes?: string | null
          delivered_at?: string | null
          delivery_address_id?: string | null
          delivery_address_text?: string
          delivery_fee?: number
          delivery_lat?: number | null
          delivery_lng?: number | null
          discount?: number
          driver_id?: string | null
          estimated_delivery_at?: string | null
          estimated_ready_at?: string | null
          id?: string
          order_number?: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          picked_up_at?: string | null
          promotion_id?: string | null
          ready_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          mp_payment_id: string | null
          mp_preference_id: string | null
          mp_status: string | null
          mp_status_detail: string | null
          order_id: string
          paid_at: string | null
          raw_payload: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          mp_status?: string | null
          mp_status_detail?: string | null
          order_id: string
          paid_at?: string | null
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          mp_status?: string | null
          mp_status_detail?: string | null
          order_id?: string
          paid_at?: string | null
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_id: string
          created_at: string | null
          direccion_id: string
          estado: Database["public"]["Enums"]["estado_pedido"]
          id: string
          local_id: string
          mp_estado_pago: string | null
          mp_pago_id: string | null
          notas: string | null
          repartidor_id: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          direccion_id: string
          estado?: Database["public"]["Enums"]["estado_pedido"]
          id?: string
          local_id: string
          mp_estado_pago?: string | null
          mp_pago_id?: string | null
          notas?: string | null
          repartidor_id?: string | null
          total: number
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          direccion_id?: string
          estado?: Database["public"]["Enums"]["estado_pedido"]
          id?: string
          local_id?: string
          mp_estado_pago?: string | null
          mp_pago_id?: string | null
          notas?: string | null
          repartidor_id?: string | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_direccion_id_fkey"
            columns: ["direccion_id"]
            isOneToOne: false
            referencedRelation: "direcciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_repartidor_id_fkey"
            columns: ["repartidor_id"]
            isOneToOne: false
            referencedRelation: "repartidores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          id: string
          name: string
          sort_order: number
          store_id: string
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
          store_id: string
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_modifier_options: {
        Row: {
          id: string
          modifier_id: string
          name: string
          price_delta: number
        }
        Insert: {
          id?: string
          modifier_id: string
          name: string
          price_delta?: number
        }
        Update: {
          id?: string
          modifier_id?: string
          name?: string
          price_delta?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_modifier_options_modifier_id_fkey"
            columns: ["modifier_id"]
            isOneToOne: false
            referencedRelation: "product_modifiers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_modifiers: {
        Row: {
          id: string
          is_required: boolean
          max_select: number
          min_select: number
          name: string
          product_id: string
        }
        Insert: {
          id?: string
          is_required?: boolean
          max_select?: number
          min_select?: number
          name: string
          product_id: string
        }
        Update: {
          id?: string
          is_required?: boolean
          max_select?: number
          min_select?: number
          name?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_modifiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          activo: boolean | null
          categoria_id: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          imagen_url: string | null
          local_id: string
          nombre: string
          precio: number
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          categoria_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          local_id: string
          nombre: string
          precio: number
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          categoria_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          local_id?: string
          nombre?: string
          precio?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          compare_at_price: number | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_available: boolean
          name: string
          price: number
          product_category_id: string | null
          sku: string | null
          sort_order: number
          store_id: string
          updated_at: string
        }
        Insert: {
          compare_at_price?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_available?: boolean
          name: string
          price: number
          product_category_id?: string | null
          sku?: string | null
          sort_order?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          compare_at_price?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_available?: boolean
          name?: string
          price?: number
          product_category_id?: string | null
          sku?: string | null
          sort_order?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_product_category_id_fkey"
            columns: ["product_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          code: string | null
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number | null
          per_user_limit: number
          starts_at: string | null
          store_id: string | null
          type: Database["public"]["Enums"]["promo_type"]
          uses_count: number
          value: number | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          per_user_limit?: number
          starts_at?: string | null
          store_id?: string | null
          type: Database["public"]["Enums"]["promo_type"]
          uses_count?: number
          value?: number | null
        }
        Update: {
          code?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          per_user_limit?: number
          starts_at?: string | null
          store_id?: string | null
          type?: Database["public"]["Enums"]["promo_type"]
          uses_count?: number
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      repartidores: {
        Row: {
          activo: boolean | null
          created_at: string | null
          id: string
          nombre: string
          telefono: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          id?: string
          nombre: string
          telefono?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          id?: string
          nombre?: string
          telefono?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_id: string
          delivery_rating: number | null
          id: string
          order_id: string | null
          store_id: string
          store_rating: number | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id: string
          delivery_rating?: number | null
          id?: string
          order_id?: string | null
          store_id: string
          store_rating?: number | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string
          delivery_rating?: number | null
          id?: string
          order_id?: string | null
          store_id?: string
          store_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_hours: {
        Row: {
          closes_at: string
          id: string
          opens_at: string
          store_id: string
          weekday: number
        }
        Insert: {
          closes_at: string
          id?: string
          opens_at: string
          store_id: string
          weekday: number
        }
        Update: {
          closes_at?: string
          id?: string
          opens_at?: string
          store_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_hours_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_users: {
        Row: {
          created_at: string
          is_active: boolean
          role: string
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          role: string
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          role?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_users_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          accepts_cash: boolean
          accepts_mp: boolean
          address: string
          avg_prep_minutes: number
          category_id: string | null
          commission_pct: number
          cover_url: string | null
          created_at: string
          deleted_at: string | null
          delivery_fee: number
          delivery_radius_km: number
          description: string | null
          email: string | null
          id: string
          is_featured: boolean
          lat: number | null
          lng: number | null
          logo_url: string | null
          min_order_amount: number
          name: string
          phone: string | null
          rating_avg: number
          rating_count: number
          slug: string
          status: Database["public"]["Enums"]["store_status"]
          updated_at: string
        }
        Insert: {
          accepts_cash?: boolean
          accepts_mp?: boolean
          address: string
          avg_prep_minutes?: number
          category_id?: string | null
          commission_pct?: number
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          delivery_fee?: number
          delivery_radius_km?: number
          description?: string | null
          email?: string | null
          id?: string
          is_featured?: boolean
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          min_order_amount?: number
          name: string
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          slug: string
          status?: Database["public"]["Enums"]["store_status"]
          updated_at?: string
        }
        Update: {
          accepts_cash?: boolean
          accepts_mp?: boolean
          address?: string
          avg_prep_minutes?: number
          category_id?: string | null
          commission_pct?: number
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          delivery_fee?: number
          delivery_radius_km?: number
          description?: string | null
          email?: string | null
          id?: string
          is_featured?: boolean
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          min_order_amount?: number
          name?: string
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          slug?: string
          status?: Database["public"]["Enums"]["store_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_payment_webhook: {
        Args: {
          p_amount: number
          p_mp_payment_id: string
          p_order_id: string
          p_raw: Json
          p_status: Database["public"]["Enums"]["payment_status"]
          p_status_detail: string
        }
        Returns: undefined
      }
      current_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_store_member: { Args: { p_store_id: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      delivery_status:
        | "unassigned"
        | "assigned"
        | "heading_to_store"
        | "at_store"
        | "heading_to_customer"
        | "delivered"
        | "failed"
      estado_pedido:
        | "nuevo"
        | "preparando"
        | "listo"
        | "en_camino"
        | "entregado"
        | "cancelado"
      notification_channel: "in_app" | "email" | "push" | "sms" | "whatsapp"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "picked_up"
        | "delivered"
        | "completed"
        | "cancelled"
        | "rejected"
      payment_method: "cash" | "mercadopago" | "card_on_delivery"
      payment_status:
        | "pending"
        | "authorized"
        | "approved"
        | "rejected"
        | "refunded"
        | "cancelled"
      promo_type: "percent" | "amount" | "free_delivery" | "bxgy"
      store_status: "draft" | "pending_review" | "active" | "paused" | "closed"
      user_role:
        | "customer"
        | "store_owner"
        | "store_staff"
        | "delivery_driver"
        | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      delivery_status: [
        "unassigned",
        "assigned",
        "heading_to_store",
        "at_store",
        "heading_to_customer",
        "delivered",
        "failed",
      ],
      estado_pedido: [
        "nuevo",
        "preparando",
        "listo",
        "en_camino",
        "entregado",
        "cancelado",
      ],
      notification_channel: ["in_app", "email", "push", "sms", "whatsapp"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "picked_up",
        "delivered",
        "completed",
        "cancelled",
        "rejected",
      ],
      payment_method: ["cash", "mercadopago", "card_on_delivery"],
      payment_status: [
        "pending",
        "authorized",
        "approved",
        "rejected",
        "refunded",
        "cancelled",
      ],
      promo_type: ["percent", "amount", "free_delivery", "bxgy"],
      store_status: ["draft", "pending_review", "active", "paused", "closed"],
      user_role: [
        "customer",
        "store_owner",
        "store_staff",
        "delivery_driver",
        "admin",
      ],
    },
  },
} as const

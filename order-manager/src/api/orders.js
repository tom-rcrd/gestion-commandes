import { supabase } from "../supabase"

// ➕ Ajouter une commande
export async function saveOrder(order) {
  const { error } = await supabase.from("orders").insert([order])
  if (error) throw error
}

// 📥 Récupérer les commandes
export async function getOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

// 🔄 Marquer comme envoyé
export async function markAsShipped(orderId) {
  const { error } = await supabase
    .from("orders")
    .update({ shipped: true })
    .eq("id", orderId)

  if (error) throw error
}

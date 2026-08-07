// app/api/ai/route.ts

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { question, farmData } = await req.json()
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const lowerQuestion = question.toLowerCase()
    let answer = ''

    // Financial questions
    if (lowerQuestion.includes('profit') || lowerQuestion.includes('money') || lowerQuestion.includes('income')) {
      const net = farmData?.income - farmData?.expenses || 0
      if (net > 0) {
        answer = `📈 Your farm is currently profitable! You've made R${net.toFixed(2)} in profit. Your top income source is likely your most profitable crop. I recommend tracking expenses by category to identify your highest-margin products and consider expanding those areas.`
      } else if (net < 0) {
        answer = `📉 Your farm is currently operating at a loss of R${Math.abs(net).toFixed(2)}. I recommend reviewing your expense categories to identify cost-saving opportunities. Consider negotiating with suppliers or optimizing input usage.`
      } else {
        answer = `💰 Your farm is breaking even. This is a good starting point! Focus on increasing revenue or reducing costs. I can help you analyze which expenses to cut first.`
      }
    }

    // Crop questions
    else if (lowerQuestion.includes('crop') || lowerQuestion.includes('plant') || lowerQuestion.includes('harvest')) {
      const cropCount = farmData?.activeCrops || 0
      if (cropCount > 0) {
        answer = `🌱 You have ${cropCount} active crops! I recommend rotating crops between fields to maintain soil health. Consider diversifying if you're relying on a single crop. A diverse crop mix can help spread risk and improve soil fertility.`
      } else {
        answer = `🌿 You don't have any active crops yet. Consider starting with a high-value crop like tomatoes or peppers. RootBase can help you track every stage from planting to harvest.`
      }
    }

    // Task questions
    else if (lowerQuestion.includes('task') || lowerQuestion.includes('todo') || lowerQuestion.includes('reminder')) {
      const overdue = farmData?.overdueTasks || 0
      if (overdue > 0) {
        answer = `📋 You have ${overdue} overdue tasks! I recommend prioritizing urgent tasks first, then tackling high-priority items. Break large tasks into smaller steps and schedule them throughout the week.`
      } else {
        answer = `✅ Great job! You have no overdue tasks. Stay on track by reviewing your task list daily and updating priorities as needed.`
      }
    }

    // Inventory questions
    else if (lowerQuestion.includes('inventory') || lowerQuestion.includes('stock') || lowerQuestion.includes('supply')) {
      const lowStock = farmData?.lowStockItems || 0
      if (lowStock > 0) {
        answer = `📦 You have ${lowStock} items that need reordering! I recommend reviewing your inventory weekly and setting up automatic reordering for critical supplies like seed and fertiliser.`
      } else {
        answer = `📦 Your inventory levels look good! Continue monitoring stock levels and reorder before critical items run out.`
      }
    }

    // General help
    else if (lowerQuestion.includes('help') || lowerQuestion.includes('what can') || lowerQuestion.includes('how to')) {
      answer = `🤖 I can help you with:
      
• 📊 Finances: Track income, expenses, and profit
• 🌱 Crops: Manage plantings, harvests, and yields
• 🐄 Livestock: Monitor health and breeding
• ✅ Tasks: Organize and prioritize farm work
• 📦 Inventory: Track stock levels and reorder
• 🌤️ Weather: Get farming advice based on conditions
• 📖 Journal: Record daily observations

Just ask me anything about your farm!`
    }

    // Fallback
    else {
      answer = `🤔 That's a great question about "${question}". 

Based on your farm data, I recommend focusing on what's working best. 

Here are some areas I can help with:
• Financial analysis and profitability
• Crop planning and rotation strategies
• Task prioritization and scheduling
• Inventory management tips
• Livestock health monitoring

Would you like me to dive deeper into any specific area?`
    }

    if (farmData?.farmName) {
      answer += `\n\n🌾 This advice is tailored for ${farmData.farmName}. Let me know if you need more specific guidance!`
    }

    return NextResponse.json({ answer })
    
  } catch (error) {
    console.error('AI error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
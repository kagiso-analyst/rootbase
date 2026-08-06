// components/export/FinancialReportPDF.tsx

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 24, marginBottom: 20 },
  section: { marginBottom: 10 },
  header: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  total: { fontSize: 16, fontWeight: 'bold', marginTop: 10, paddingTop: 10, borderTopWidth: 2, borderTopColor: '#000' },
})

export function FinancialReportPDF({ data }: any) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Financial Report</Text>
        <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>
          {data.startDate} to {data.endDate}
        </Text>

        <View style={styles.section}>
          <Text style={styles.header}>Income</Text>
          {data.income.map((item: any) => (
            <View key={item.id} style={styles.row}>
              <Text>{item.description}</Text>
              <Text>R{item.amount.toFixed(2)}</Text>
            </View>
          ))}
          <Text style={styles.total}>Total Income: R{data.totalIncome.toFixed(2)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.header}>Expenses</Text>
          {data.expenses.map((item: any) => (
            <View key={item.id} style={styles.row}>
              <Text>{item.description}</Text>
              <Text>R{item.amount.toFixed(2)}</Text>
            </View>
          ))}
          <Text style={styles.total}>Total Expenses: R{data.totalExpenses.toFixed(2)}</Text>
        </View>

        <Text style={[styles.total, { color: data.isProfit ? '#2D6A4F' : '#DC2626' }]}>
          Net {data.isProfit ? 'Profit' : 'Loss'}: R{Math.abs(data.net).toFixed(2)}
        </Text>
      </Page>
    </Document>
  )
}
// components/export/FinancialReportPDF.tsx

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Register a font (optional)
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.woff2' }
  ]
})

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica'
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#2D6A4F',
    paddingBottom: 15,
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B4332'
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B4332',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  rowText: {
    fontSize: 10,
    color: '#374151'
  },
  rowAmount: {
    fontSize: 10,
    fontWeight: 'medium'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: '#D1D5DB'
  },
  totalText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1B4332'
  },
  totalAmount: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: '#D8F3DC',
    borderRadius: 4,
    paddingHorizontal: 12
  },
  netText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B4332'
  },
  netAmount: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF'
  },
  metric: {
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2
  },
  metricLabel: {
    fontSize: 9,
    color: '#6B7280'
  },
  metricValue: {
    fontSize: 9,
    fontWeight: 'bold'
  }
})

interface ReportData {
  startDate: string
  endDate: string
  income: any[]
  expenses: any[]
  totalIncome: number
  totalExpenses: number
  net: number
  isProfit: boolean
  profitMargin: string
  farmName: string
}

export function FinancialReportPDF({ data }: { data: ReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>RootBase Financial Report</Text>
          <Text style={styles.subtitle}>{data.farmName} · {data.startDate} to {data.endDate}</Text>
        </View>

        {/* Metrics */}
        <View style={styles.metric}>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Income</Text>
            <Text style={[styles.metricValue, { color: '#16A34A' }]}>R{data.totalIncome.toFixed(2)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Expenses</Text>
            <Text style={[styles.metricValue, { color: '#DC2626' }]}>R{data.totalExpenses.toFixed(2)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Net {data.isProfit ? 'Profit' : 'Loss'}</Text>
            <Text style={[styles.metricValue, { color: data.isProfit ? '#16A34A' : '#DC2626' }]}>
              {data.isProfit ? '+' : '-'}R{Math.abs(data.net).toFixed(2)}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Profit Margin</Text>
            <Text style={[styles.metricValue, { color: data.isProfit ? '#16A34A' : '#DC2626' }]}>
              {data.profitMargin}%
            </Text>
          </View>
        </View>

        {/* Income Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income</Text>
          {data.income.length === 0 ? (
            <Text style={styles.rowText}>No income recorded</Text>
          ) : (
            data.income.map((item, index) => (
              <View key={index} style={styles.row}>
                <Text style={styles.rowText}>{item.description || item.category}</Text>
                <Text style={[styles.rowAmount, { color: '#16A34A' }]}>R{item.amount.toFixed(2)}</Text>
              </View>
            ))
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Total Income</Text>
            <Text style={[styles.totalAmount, { color: '#16A34A' }]}>R{data.totalIncome.toFixed(2)}</Text>
          </View>
        </View>

        {/* Expenses Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expenses</Text>
          {data.expenses.length === 0 ? (
            <Text style={styles.rowText}>No expenses recorded</Text>
          ) : (
            data.expenses.map((item, index) => (
              <View key={index} style={styles.row}>
                <Text style={styles.rowText}>{item.description || item.category}</Text>
                <Text style={[styles.rowAmount, { color: '#DC2626' }]}>R{item.amount.toFixed(2)}</Text>
              </View>
            ))
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Total Expenses</Text>
            <Text style={[styles.totalAmount, { color: '#DC2626' }]}>R{data.totalExpenses.toFixed(2)}</Text>
          </View>
        </View>

        {/* Net Result */}
        <View style={styles.netRow}>
          <Text style={styles.netText}>NET {data.isProfit ? 'PROFIT' : 'LOSS'}</Text>
          <Text style={[styles.netAmount, { color: data.isProfit ? '#16A34A' : '#DC2626' }]}>
            {data.isProfit ? '+' : '-'}R{Math.abs(data.net).toFixed(2)}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated by RootBase</Text>
          <Text style={styles.footerText}>{new Date().toLocaleDateString()}</Text>
        </View>
      </Page>
    </Document>
  )
}
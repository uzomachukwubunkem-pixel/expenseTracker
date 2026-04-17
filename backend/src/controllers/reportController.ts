import type { Request, Response } from 'express'
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import { asyncHandler } from '../middleware/asyncHandler'
import { listAlerts } from '../services/alertService'
import { getCompanySettings, getTaxSummary, upsertCompanySettings } from '../services/reportService'
import { generateCITReturn, generateVATReturn } from '../services/taxService'

const readPeriod = (req: Request): { start: Date; end: Date } => {
  if (req.query.year) {
    const year = Number(req.query.year)
    if (Number.isFinite(year) && year > 1900 && year < 9999) {
      return {
        start: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
        end: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
      }
    }
  }

  return {
    start: req.query.start ? new Date(String(req.query.start)) : new Date('1970-01-01'),
    end: req.query.end ? new Date(String(req.query.end)) : new Date(),
  }
}

export const taxSummaryHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getTaxSummary(readPeriod(req))
  res.json({ success: true, data })
})

export const alertsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await listAlerts()
  res.json({ success: true, data })
})

export const getCompanySettingsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getCompanySettings()
  res.json({ success: true, data })
})

export const upsertCompanySettingsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await upsertCompanySettings(req.body)
  res.json({ success: true, data })
})

export const vatReturnHandler = asyncHandler(async (req: Request, res: Response) => {
  const vatReturn = await generateVATReturn(readPeriod(req))
  const format = String(req.query.format ?? 'json')

  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('VAT Return')
    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Input VAT', key: 'inputVAT', width: 15 },
    ]
    vatReturn.expenses.forEach((expense) => {
      sheet.addRow({
        date: new Date(expense.date).toISOString().slice(0, 10),
        description: expense.description,
        amount: expense.amount,
        inputVAT: expense.inputVAT,
      })
    })

    sheet.addRow({})
    sheet.addRow({ description: 'Total Input VAT', inputVAT: vatReturn.totalInputVAT })

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader('Content-Disposition', 'attachment; filename=vat-return.xlsx')

    await workbook.xlsx.write(res)
    res.end()
    return
  }

  if (format === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename=vat-return.pdf')

    const pdf = new PDFDocument({ margin: 40 })
    pdf.pipe(res)
    pdf.fontSize(16).text('VAT Return', { underline: true })
    pdf.moveDown()
    pdf.fontSize(11).text(`Period: ${vatReturn.period.start.toISOString()} to ${vatReturn.period.end.toISOString()}`)
    pdf.moveDown()

    for (const expense of vatReturn.expenses) {
      pdf.text(
        `${new Date(expense.date).toISOString().slice(0, 10)} | ${expense.description} | Amount: ${expense.amount.toFixed(2)} | Input VAT: ${expense.inputVAT.toFixed(2)}`,
      )
    }

    pdf.moveDown()
    pdf.text(`Total Input VAT: ${vatReturn.totalInputVAT.toFixed(2)}`)
    pdf.end()
    return
  }

  res.json({ success: true, data: vatReturn })
})

export const citReturnHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await generateCITReturn(readPeriod(req))
  res.json({ success: true, data })
})

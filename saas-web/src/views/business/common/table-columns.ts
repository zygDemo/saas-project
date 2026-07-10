import { h } from 'vue'
import { ElTag, ElButton, ElSpace } from 'element-plus'

type NormalizeTagType = (value: unknown) => 'primary' | 'success' | 'warning' | 'info' | 'danger'
type FormatCell = (row: Record<string, unknown>, prop: string) => string

type BuildTableColumnsArgs = {
  configColumns: Array<{ prop: string; label: string; width?: number }>
  isOrgModule: boolean
  formatCell: FormatCell
  statusTagType: (value: unknown) => string
  normalizeTagType: NormalizeTagType
  openDetail: (row: Record<string, unknown>) => void
  openEdit: (row: Record<string, unknown>) => void
  handleDelete: (row: Record<string, unknown>) => void
  openAction: (row: Record<string, unknown>, action: Record<string, unknown>) => void
  rowActions: (row: Record<string, unknown>) => Array<Record<string, unknown>>
  readonly: boolean
}

function renderOrgNameCell(row: Record<string, unknown>, formatCell: FormatCell) {
  return h('div', { class: 'org-name-cell' }, [
    h('div', { class: 'org-name-cell__icon' }, [h('i', { class: 'ri-building-2-line' })]),
    h('div', { class: 'org-name-cell__content' }, [
      h('strong', {}, formatCell(row, 'name')),
      h('span', {}, formatCell(row, 'code'))
    ])
  ])
}

function renderOrgContactCell(row: Record<string, unknown>, formatCell: FormatCell) {
  return h('div', { class: 'org-contact-cell' }, [
    h('span', {}, formatCell(row, 'contactName')),
    row.contactPhone
      ? h('a', { href: `tel:${row.contactPhone}` }, String(row.contactPhone))
      : h('span', { class: 'text-g-500' }, '未填写联系电话')
  ])
}

function renderOrgPackageCell(row: Record<string, unknown>, formatCell: FormatCell) {
  return h('div', { class: 'org-service-cell' }, [
    h('span', { class: 'org-service-cell__package' }, formatCell(row, 'packageType')),
    h(
      ElTag,
      {
        type: formatCell(row, 'expireAt') ? 'warning' : 'info',
        effect: 'plain',
        size: 'small'
      },
      () => formatCell(row, 'expireAt')
    )
  ])
}

function renderOrgApiEnabledCell(row: Record<string, unknown>) {
  return h(ElTag, { type: row.apiEnabled === false ? 'info' : 'success', effect: 'light' }, () =>
    row.apiEnabled === false ? '已关闭' : '已开启'
  )
}

function renderOrgScaleCell(row: Record<string, unknown>, formatCell: FormatCell) {
  return h('div', { class: 'org-scale-cell' }, [
    h('span', {}, ['部门 ', h('strong', {}, formatCell(row, 'departmentCount'))]),
    h('span', {}, ['产品 ', h('strong', {}, formatCell(row, 'productCount'))]),
    h('span', {}, ['资方 ', h('strong', {}, formatCell(row, 'funderCount'))])
  ])
}

function renderStatusCell(
  row: Record<string, unknown>,
  prop: string,
  formatCell: FormatCell,
  statusTagType: (value: unknown) => string,
  normalizeTagType: NormalizeTagType
) {
  return h(ElTag, { type: normalizeTagType(statusTagType(row[prop])), effect: 'light' }, () =>
    formatCell(row, prop)
  )
}

function renderOperationCell(row: Record<string, unknown>, args: BuildTableColumnsArgs) {
  const buttons = [
    h(ElButton, { link: true, type: 'primary', onClick: () => args.openDetail(row) }, () => '详情')
  ]

  if (!args.readonly) {
    buttons.push(
      h(ElButton, { link: true, type: 'primary', onClick: () => args.openEdit(row) }, () => '编辑')
    )
    buttons.push(
      h(
        ElButton,
        { link: true, type: 'danger', onClick: () => args.handleDelete(row) },
        () => '删除'
      )
    )
  }

  for (const action of args.rowActions(row)) {
    buttons.push(
      h(
        ElButton,
        {
          link: true,
          type: args.normalizeTagType((action as { type?: string }).type || 'success'),
          onClick: () => args.openAction(row, action)
        },
        () => String((action as { label?: string }).label || '')
      )
    )
  }

  return h(ElSpace, { wrap: true }, () => buttons)
}

export function buildBusinessTableColumns(
  args: BuildTableColumnsArgs
): Array<Record<string, unknown>> {
  const cols: Array<Record<string, unknown>> = [{ type: 'index', width: 60, label: '序号' }]

  for (const column of args.configColumns) {
    cols.push({
      prop: column.prop,
      label: column.label,
      minWidth: column.width || 140,
      showOverflowTooltip:
        !args.isOrgModule ||
        !['name', 'contactName', 'packageType', 'businessScale'].includes(column.prop),
      formatter: (row: Record<string, unknown>) => {
        if (args.isOrgModule && column.prop === 'name')
          return renderOrgNameCell(row, args.formatCell)
        if (args.isOrgModule && column.prop === 'contactName')
          return renderOrgContactCell(row, args.formatCell)
        if (args.isOrgModule && column.prop === 'packageType')
          return renderOrgPackageCell(row, args.formatCell)
        if (args.isOrgModule && column.prop === 'apiEnabled') return renderOrgApiEnabledCell(row)
        if (args.isOrgModule && column.prop === 'businessScale')
          return renderOrgScaleCell(row, args.formatCell)
        if (column.prop === 'status') {
          return renderStatusCell(
            row,
            column.prop,
            args.formatCell,
            args.statusTagType,
            args.normalizeTagType
          )
        }
        return h('span', {}, args.formatCell(row, column.prop))
      }
    })
  }

  cols.push({
    prop: 'operation',
    label: '操作',
    width: args.isOrgModule ? 270 : 360,
    fixed: 'right',
    formatter: (row: Record<string, unknown>) => renderOperationCell(row, args)
  })

  return cols
}

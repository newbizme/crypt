import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { finalize } from 'rxjs/operators';

import { DataTableCommonManagerComponent } from "../../../shared/components/data-table-common-manager/data-table-common-manager.component";
import { TableDataSource, TableDataColumn } from "../../../shared/components/data-table/data-table.component";
import { StatusCellDataColumn, PercentCellDataColumn, NumberCellDataColumn } from "../../../shared/components/data-table-cells";
import { StatusClass } from "../../../shared/models/common";
import { Deposit } from "../../../shared/models/deposit";

import { DepositService } from "../../../services/deposit/deposit.service";

@Component({
  selector: 'app-deposit-list',
  templateUrl: './deposit-list.component.html',
  styleUrls: ['./deposit-list.component.scss']
})
export class DepositListComponent extends DataTableCommonManagerComponent implements OnInit {

  public depositDataSource: TableDataSource = {
    header: [
      { column: 'id', nameKey: 'table.header.id', filter: { type: 'number', hasRange: false, inputSearch: true, sortable: true } },
      { column: 'investment_run_id', nameKey: 'table.header.investment_run_id', filter: { type: 'text', sortable: true } },
      { column: 'quote_asset', nameKey: 'table.header.quote_asset', filter: { type: 'text', sortable: true } },
      { column: 'exchange', nameKey: 'table.header.exchange', filter: { type: 'text', sortable: true } },
      { column: 'account', nameKey: 'table.header.account', filter: { type: 'text', sortable: true }, column_class: 'word-wrap' },
      { column: 'amount', nameKey: 'table.header.amount', filter: { type: 'number', sortable: true } },
      { column: 'investment_percentage', nameKey: 'table.header.investment_percentage', filter: { type: 'number', sortable: true } },
      { column: 'status', nameKey: 'table.header.status', filter: { type: 'text', sortable: true } },
    ],
    body: null
  };

  public depositColumnsToShow: Array<TableDataColumn> = [
    new TableDataColumn({ column: 'id' }),
    new TableDataColumn({ column: 'investment_run_id' }),
    new TableDataColumn({ column: 'quote_asset' }),
    new TableDataColumn({ column: 'exchange' }),
    new TableDataColumn({ column: 'account' }),
    new NumberCellDataColumn({ column: 'amount'}),
    new PercentCellDataColumn({ column: 'investment_percentage' }),
    new StatusCellDataColumn({ column: 'status', inputs: { classMap: {
      'deposits.status.150' : StatusClass.PENDING,
      'deposits.status.151': StatusClass.APPROVED,
    }}}),
  ];

  constructor(
    public route: ActivatedRoute,
    protected depositService: DepositService,
    public router: Router,
  ) { 
    super(route, router);
  }

  ngOnInit() {
    super.ngOnInit();
    this.getFilterLOV();
  }

  getAllData(): void {
    this.depositService.getAllDeposits(this.requestData).pipe(
      finalize(() => this.stopTableLoading())
    ).subscribe(
      res => {
        Object.assign(this.depositDataSource, {
          body: res.recipe_deposits,
          footer: res.footer
        });
        this.count = res.count || res.recipe_deposits.length;
      }
    )
  }

  getFilterLOV(): void {
    this.depositDataSource.header.filter(
      col => col.filter && (col.filter.type == 'text' || col.filter.type == 'boolean')
    ).map(
      col => {
        col.filter.rowData$ = this.depositService.getHeaderLOV(col.column)
      }
    )
  }

  public openRow(deposit: Deposit): void {
    this.router.navigate(['/deposits/view', deposit.id]);
  }

}

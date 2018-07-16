import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { StatusClass } from '../../../shared/models/common';

import { TimelineDetailComponent, SingleTableDataSource, TagLineItem } from '../timeline-detail/timeline-detail.component';
import { TimelineEvent } from '../timeline/timeline.component';
import { TableDataSource, TableDataColumn } from '../../../shared/components/data-table/data-table.component';
import { DateCellDataColumn, StatusCellDataColumn, PercentCellDataColumn } from '../../../shared/components/data-table-cells';
import { InvestmentService } from '../../../services/investment/investment.service';
import { mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-deposit-detail',
  templateUrl: '../timeline-detail/timeline-detail.component.html',
  styleUrls: ['../timeline-detail/timeline-detail.component.scss']
})
export class DepositDetailComponent extends TimelineDetailComponent implements OnInit {
  /**
   * 1. Implement abstract attributes to display titles
   */
  public pageTitle: string = 'Recipe run';
  public singleTitle: string = 'Recipe run';
  public listTitle: string = 'Deposits';

  /**
   * 2. Implement abstract attributes to preset data structure
   */
  public timelineEvents: Array<TimelineEvent>;

  public singleDataSource: SingleTableDataSource = {
    header: [
      { column: 'id', name: 'Id' },
      { column: 'created_timestamp', name: 'Creation time' },
      { column: 'user_created_id', name: 'Creator' },
      { column: 'approval_status', name: 'Status' },
      { column: 'approval_user_id', name: 'Decision by' },
      { column: 'approval_timestamp', name: 'Decision time' },
      { column: 'approval_comment', name: 'Rationale' },
    ],
    body: null,
  };

  public singleColumnsToShow: Array<TableDataColumn> = [
    new TableDataColumn({ column: 'id' }),
    new DateCellDataColumn({ column: 'created_timestamp' }),
    new TableDataColumn({ column: 'user_created_id' }),
    new StatusCellDataColumn({ column: 'approval_status', inputs: { classMap: {
      '41' : StatusClass.PENDING,
      '42': StatusClass.REJECTED,
      '43': StatusClass.APPROVED,
    }}}),
    new TableDataColumn({ column: 'approval_user_id' }),
    new DateCellDataColumn({ column: 'approval_timestamp' }),
    new TableDataColumn({ column: 'approval_comment' }),
  ];


  public listDataSource: TableDataSource = {
    header: [
      { column: 'id', name: 'Id', filter: {type: 'text', sortable: true }},
      { column: 'transaction_asset', name: 'Transaction asset', filter: {type: 'text', sortable: true }},
      { column: 'exchange', name: 'Exchange', filter: {type: 'text', sortable: true }},
      { column: 'account', name: 'Account', filter: {type: 'text', sortable: true }},
      { column: 'amount', name: 'Amount', filter: {type: 'number', sortable: true }},
      { column: 'investment_percentage', name: 'Investment percentage', filter: {type: 'number', sortable: true }},
      { column: 'status', name: 'Status' },
    ],
    body: null,
  };

  public listColumnsToShow: Array<TableDataColumn> = [
    new TableDataColumn({ column: 'id' }),
    new TableDataColumn({ column: 'transaction_asset' }),
    new TableDataColumn({ column: 'exchange' }),
    new TableDataColumn({ column: 'account' }),
    new TableDataColumn({ column: 'amount' }),
    new PercentCellDataColumn({ column: 'investment_percentage' }),
    new StatusCellDataColumn({ column: 'status', inputs: { classMap: {
      '150': StatusClass.PENDING,
      '151': StatusClass.APPROVED,
    }}}),
  ];

  /**
   * 3. Call super() with ActivatedRoute
   * @param route - ActivatedRoute, used in DataTableCommonManagerComponent
   */
  constructor(
    public route: ActivatedRoute,
    private router: Router,
    private investmentService: InvestmentService,
  ) {
    super(route);
  }

  /**
   * 4. Implement abstract methods to fetch data OnInit
   */
  protected getSingleData(): void {
    this.route.params.pipe(
      mergeMap(
        params => this.investmentService.getSingleRecipe(params['id'])
      )
    ).subscribe(
      res => {
        if(res.recipe_run) {
          this.singleDataSource.body = [ res.recipe_run ];
        }
        if(res.recipe_stats) {
          this.setTagLine(
            res.recipe_stats.map(o => new TagLineItem(`${o.count} ${o.name}`))
          );
        }
      },
      err => this.singleDataSource.body = []
    )
  }

  public getAllData(): void {
    this.route.params.pipe(
      mergeMap(
        params => this.investmentService.getAllRecipeDeposits(params['id'])
      )
    ).subscribe(
      res => {
        this.count = res.count;
        this.listDataSource.body = res.recipe_deposits;
        this.listDataSource.footer = res.footer;
        console.log('footer', res.footer);
      },
      err => this.listDataSource.body = []
    )
  }

  protected getTimelineData(): void {
    this.timeline$ = this.investmentService.getTimelineData();
  }

  /**
   * 5. Implement abstract methods to handle user actions
   */

  public openSingleRow(row: any): void {
    // Navigate to a single item page
  }

  public openListRow(row: any): void {
    alert('Navigate to a row item page');
  }


  /**
   * + If custom ngOnInit() is needed, call super.ngOnInit() to
   * perform parent component class initialization
   */

  ngOnInit() {
    super.ngOnInit();
  }

  /**
   * Additional
   */

  private confirmRun(run: any): void {
    alert('confirmRun');
  }

  private declineRun(run: any): void {
    alert('declineRun');
  }

}

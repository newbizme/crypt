import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InvestmentRoutingModule } from './investment-routing.module';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
//import { TimelineComponent } from './timeline/timeline.component';
import { InvestmentRunDetailComponent } from './investment-run-detail/investment-run-detail.component';
import { RecipeRunDetailComponent } from './recipe-run-detail/recipe-run-detail.component';
import { OrderDetailComponent } from './order-detail/order-detail.component';
import { ExecutionOrderDetailComponent } from './execution-order-detail/execution-order-detail.component';
import { ExecutionOrderFillDetailComponent } from './execution-order-fill-detail/execution-order-fill-detail.component';
import { DepositDetailComponent } from './deposit-detail/deposit-detail.component';
import { ExecutionOrdersComponent } from './execution-orders/execution-orders.component';
import { OrderGroupComponent } from './order-group/order-group.component';
import { TimelineDetailComponent } from './timeline-detail/timeline-detail.component';

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    RouterModule, // TODO: Remove this when moving to lazy loaded modules
    SharedModule
    // InvestmentRoutingModule
  ],
  declarations: [
    //TimelineComponent,
    InvestmentRunDetailComponent,
    RecipeRunDetailComponent,
    OrderDetailComponent,
    ExecutionOrderDetailComponent,
    ExecutionOrderFillDetailComponent,
    DepositDetailComponent,
    ExecutionOrdersComponent,
    OrderGroupComponent,
    TimelineDetailComponent
  ]
})
export class InvestmentModule { }

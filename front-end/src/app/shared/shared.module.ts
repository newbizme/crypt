import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'
import { CommonModule } from '@angular/common';

import { Ng2FlatpickrModule } from 'ng2-flatpickr';
import { DynamicModule } from 'ng-dynamic-component';

import { BtnComponent } from './components/btn/btn.component'
import { DataTableComponent } from './components/data-table/data-table.component'
import { ModalComponent } from './components/modal/modal.component'
import { PaginationComponent } from './components/pagination/pagination.component';
import { ContentBlockComponent } from './components/content-block/content-block.component';
import { CheckboxComponent } from './components/checkbox/checkbox.component';
import { ButtonCheckboxComponent } from './components/button-checkbox/button-checkbox.component';
import { FormActionBarComponent } from './components/form-action-bar/form-action-bar.component';
import { ConfirmComponent } from './components/confirm/confirm.component';
import { DataTableFilterComponent } from './components/data-table-filter/data-table-filter.component'

import { FilterPipe } from './pipes/filter.pipe';
import { DataTableCommonManagerComponent } from './components/data-table-common-manager/data-table-common-manager.component';
import { ButtonBackComponent } from './components/button-back/button-back.component';
import { PageHeadingComponent } from './components/page-heading/page-heading.component';
import { RouterModule } from '@angular/router';
import { InputItemComponent } from './components/input-item/input-item.component';
import { ActionCellComponent } from './components/data-table-cells/action-cell/action-cell.component';
import { CurrencyCellComponent } from './components/data-table-cells/currency-cell/currency-cell.component';
import { PercentCellComponent } from './components/data-table-cells/percent-cell/percent-cell.component';
import { NumberCellComponent } from './components/data-table-cells/number-cell/number-cell.component';
import { DateCellComponent } from './components/data-table-cells/date-cell/date-cell.component';
import { BooleanCellComponent } from './components/data-table-cells/boolean-cell/boolean-cell.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        Ng2FlatpickrModule,
        DynamicModule.withComponents([
          ActionCellComponent,
          CurrencyCellComponent,
          PercentCellComponent,
          NumberCellComponent,
          DateCellComponent,
          BooleanCellComponent,
        ])
    ],
    declarations: [
        BtnComponent,
        DataTableComponent,
        ModalComponent,
        PaginationComponent,
        ContentBlockComponent,
        CheckboxComponent,
        ButtonCheckboxComponent,
        FormActionBarComponent,
        ConfirmComponent,
        DataTableFilterComponent,
        FilterPipe,
        DataTableCommonManagerComponent,
        ButtonBackComponent,
        PageHeadingComponent,
        InputItemComponent,
        ActionCellComponent,
        CurrencyCellComponent,
        PercentCellComponent,
        NumberCellComponent,
        DateCellComponent,
        BooleanCellComponent
    ],
    exports: [
        BtnComponent,
        DataTableComponent,
        ModalComponent,
        PaginationComponent,
        ContentBlockComponent,
        CheckboxComponent,
        ButtonCheckboxComponent,
        FormActionBarComponent,
        ConfirmComponent,
        DataTableFilterComponent,
        FilterPipe,
        DataTableCommonManagerComponent,
        ButtonBackComponent,
        PageHeadingComponent,
        FormsModule,
        InputItemComponent,
        DynamicModule
    ]
})
export class SharedModule {}
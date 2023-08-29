import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute  } from '@angular/router';
import { DataService } from '../data.service';
import { EmployeeService } from '../employee.service';



@Component({
  selector: 'app-chef',
  templateUrl: './chef.component.html',
  styleUrls: ['./chef.component.css']
})
export class ChefComponent implements OnInit {

  role !: string | null;

  orders : number[] = [];

  show_orders : boolean[] = [];

  id! : number;

  time : string[] = [];
  

  readonly URL;

  readonly postUrl;

  constructor(private dataService : DataService, private router: Router, private activatedroute: ActivatedRoute) { 
    this.id = Number(this.activatedroute.snapshot.paramMap.get('id'));
    this.URL = 'api/chef/get_chef_items/'+Number(this.id).toString();
    this.postUrl = 'api/chef/change_chef_order';
  }

  ngOnInit(): void {
    if(sessionStorage.getItem("role") != null) this.role = sessionStorage.getItem("role");
    this.getData();
    this.id = Number(this.activatedroute.snapshot.paramMap.get('id'));
    console.log('id',this.id)
  }

  getData(){
    this.orders = [];
    this.show_orders = [];
    this.dataService.get(this.URL).pipe().subscribe((d :any) => {
        console.log('Chefs',d);
        for(let x of d){
          console.log(x);
          this.orders.push(x.order_id);
          this.show_orders.push(false);
          this.time.push(x.placing_time);
        }
    });
  }

  Done(order : number){
    console.log(order);
    const x = {
     chef_id : this.id,
     order_id : order
    }
    this.dataService.post(this.postUrl,x).subscribe((d: any)=>{
        console.log(d);
        this.getData();
      });
    // this.getData();
  }

}

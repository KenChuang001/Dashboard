import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';

interface FieldBS {
  BSName: string;
  BSLocX: number;
  BSLocY: number;
  Status: string;
  imgUrl: string;
  orgBSLocX: number;
  orgBSLocY: number;
}

interface UE {
  label: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  /* local file */
  isLocal = false;   // true|false
  /* show Taffic Table */
  showTafficTable: boolean = false;

  fieldJson: any;

  energyJson: any;

  throughputJson: any;
  type: string = '1';
  day: string = '1';

  refreshTime: string = '';
  defaultMinTime = 30 / 60;  // 分鐘
  fill = false;
  tension = .4;
  // Filed
  enlarge = 50;
  filedImgs = ['blue', 'red', 'green', 'orange', 'coffee', 'pink', 'indigo', 'purple', 'lake', 'yellow'];
  BSUEListImg = 'icon_box';
  filedWidth = 40;
  filedHeight = 40;
  lineColors = [
    "#389de8",
    "#c93d7d",
    "#6bba42",
    "#dd854a",
    "#895a2b",
    "#f784b0",
    "#3c8c8c",
    "#ad78ea",
    "#79e8d3",
    "#f9bf30"
  ];      // default多組顏色 [BS1, BS2, BS3 ,...]
  BSList: FieldBS[] = [];
  BSnameMapFieldBS: Map<string, FieldBS> = new Map();
  BSUEList = [];
  // Energy
  energyData: any;
  energyOptions: any;
  energyTotalPowerColor = '#000000';
  energyColors = ['#54c435'];   // [0] Energy total color
  // energyMax = 800;
  energyMin = 0;
  energyYScale = [];
  powerConsumptionwithoutES: any;
  todayEnergyConsumption: any;
  energySaving: any;
  energySavingRatio: any;
  energyLegendShow: Map<string, boolean> = new Map();
  // throughput
  throughputData: any;
  throughputOptions: any;
  throughputColors = ['#54c435']; // [0] throughput total color
  // throughputMax = 1500;
  throughputMin = 0;
  throughputYScale = [];
  throughputUEsOfLable: any[] = [];
  throughputTDList: any[] = [];
  throughputLegendShow: Map<string, boolean> = new Map();
  BSNameMapColor: Map<string, string> = new Map();
  marquee_setInterval: any;


  @HostListener('window:resize', ['$event'])
  onResize() {
    this.resizeFieldArea();
    // this.resizeThroughArea();
  }

  constructor(private http: HttpClient) {
    this.energyColors = _.concat(this.energyColors, this.lineColors);
    this.throughputColors = _.concat(this.throughputColors, this.lineColors);
    this.energyLegendShow.set('Power Consumption(without ES)', true).set('Total Power Consumption', true);
    this.throughputLegendShow.set('Total Throughput', true);
  }

  ngOnInit(): void {

    const type = window.sessionStorage.getItem('type');
    const day = window.sessionStorage.getItem('day');
    if (type) this.type = type;
    if (day) this.day = day;
    if (this.type === 'real_time') {
      this.getRealtime(this.type);
    } else {
      this.init();
    }

    this.startTimer();
  }

  // 計時器
  startTimer() {
    let totalSecond = this.defaultMinTime * 60;
    this.refreshTime = `${addZero(Math.floor(totalSecond / 60))}: ${addZero(totalSecond % 60)}`;
    let acc = 0;
    const interval = setInterval(() => {
      acc++;
      totalSecond--;
      this.refreshTime = `${addZero(Math.floor(totalSecond / 60))}: ${addZero(totalSecond % 60)}`;
      if (acc === this.defaultMinTime * 60) {
        clearInterval(interval);
        this.startTimer();
        this.init();
      }
    }, 1000);
  }

  init() {
    // field
    this.getField();
    // energy
    this.getEnergyJson();
    // throughput
    this.getThroughputJson();
  }


  changeDay(type: string) {
    if (type === 'real_time') {
      this.getRealtime(type);
    } else {
      this.dayDeal(type, type);
    }
  }

  getRealtime(type: string) {
    if (this.isLocal) {
      this.dayDeal(type, '123');
    } else {
      //const url = 'http://10.255.174.222:8080/realtime';
      /* const url = 'http://127.0.0.1:8080/realtime';
      this.http.get(url).subscribe(
        res => {
          console.log('realtime:');
          console.log(res);
          this.dayDeal(type, res as string);
        }
      ); */
      this.dayDeal(type, '0');
    }
  }

  dayDeal(type: string, day: string) {
    this.type = type;
    this.day = day;
    window.sessionStorage.setItem('type', type);
    window.sessionStorage.setItem('day', day);
    this.init();
  }

  getField() {
    if (this.isLocal) {
      /* local file test */
      this.fieldJson = fieldJson();
      this.fieldDataSetting();
    } else {
      //const url = 'http://10.255.174.222:8080/field';
      const url = 'http://127.0.0.1:8080/field';
      this.http.get(url).subscribe(
        res => {
          console.log('getField:');
          console.log(res);
          this.fieldJson = res;
          this.fieldDataSetting();
        }
      );
    }
  }

  getEnergyJson() {
    if (this.isLocal) {
      /* local file test */
      this.energyJson = energyJson();
      this.energyDataSetting();
    } else {
      const s = `${this.day}`;//1,3,7
      //const url = 'http://10.255.174.222:8080/energy/'+s;
      const url = 'http://127.0.0.1:8080/energy/' + s;
      this.http.get(url).subscribe(
        res => {
          console.log('getEnergyJson:');
          console.log(res);
          this.energyJson = res;
          this.energyDataSetting();
        }
      );
    }
  }

  getThroughputJson() {
    if (this.isLocal) {
      /* local file test */
      this.throughputJson = throughputJson();
      this.throughputDataSetting();
    } else {
      const s = `${this.day}`;//1,3,7
      //const url = 'http://10.255.174.222:8080/throughput/'+s;
      const url = 'http://127.0.0.1:8080/throughput/' + s;
      this.http.get(url).subscribe(
        res => {
          console.log('getThroughputJson:');
          console.log(res);
          this.throughputJson = res;
          this.throughputDataSetting();
        }
      );

    }
  }

  fieldDataSetting() {
    this.BSnameMapFieldBS = new Map();
    this.BSList = this.fieldJson.Field.BSList;
    this.BSUEList = this.fieldJson.Field.BSUEList;
    this.BSList.forEach((row, idx: number) => {
      if (row['Status'] === 'ON') {
        row.imgUrl = `assets/img/${this.filedImgs[idx]}.svg`;
      } else {
        row.imgUrl = `assets/img/powerOff.svg`;
      }
      row['orgBSLocX'] = _.cloneDeep(row.BSLocX);
      row['orgBSLocY'] = _.cloneDeep(row.BSLocY);
      this.BSnameMapFieldBS.set(row.BSName, row)
    });
    this.BSUEList.forEach((row: any, idx: number) => {
      const BSname = row['BSName'];
      const fieldBS = this.BSnameMapFieldBS.get(BSname);
      row.UEList.forEach((child: any) => {
        child['color'] = this.lineColors[idx];
        child['imgUrl'] = `assets/img/${this.BSUEListImg}.svg`;
        child['BSLocX'] = fieldBS?.BSLocX;
        child['BSLocY'] = fieldBS?.BSLocY;
        child['orgBSLocX'] = _.cloneDeep(fieldBS?.BSLocX);
        child['orgBSLocY'] = _.cloneDeep(fieldBS?.BSLocY);
        child['orgUELocX'] = _.cloneDeep(child['UELocX']);
        child['orgUELocY'] = _.cloneDeep(child['UELocY']);
      });
    });
    this.resizeFieldArea();
  }

  // Auto Resize Field
  resizeFieldArea() {
    window.setTimeout(() => {
      const fieldWidth = (document.getElementsByClassName('map')[0] as any).offsetWidth;
      const fieldHeight = (document.getElementsByClassName('map')[0] as any).offsetHeight;
      const _w = fieldWidth / this.fieldJson.Field.XMax;
      const _h = fieldHeight / this.fieldJson.Field.YMax;
      this.BSList.forEach((row: FieldBS) => {
        row['BSLocX'] = row.orgBSLocX * _w;
        row['BSLocY'] = row.orgBSLocY * _h;
      });
      this.BSUEList.forEach((row: any) => {
        row.UEList.forEach((child: any) => {
          child['BSLocX'] = child['orgBSLocX'] * _w;
          child['BSLocY'] = child['orgBSLocY'] * _h;
          child['UELocX'] = child['orgUELocX'] * _w;
          child['UELocY'] = child['orgUELocY'] * _h;
        });
      });
    });
  }

  energyDataSetting() {
    this.powerConsumptionwithoutES = this.energyJson.Energy.PowerConsumptionwithoutES;
    // this.energyMax = this.energyJson.Energy.TotalPowerMax;
    const startDate = this.energyJson.Energy.TimeRange.StartDate;
    const startEnd = this.energyJson.Energy.TimeRange.StartEnd;
    const startHour = Number(this.energyJson.Energy.TimeRange.StartHour);
    const startMin = Number(this.energyJson.Energy.TimeRange.StartMin);
    const endHour = Number(this.energyJson.Energy.TimeRange.EndHour);
    const endMin = Number(this.energyJson.Energy.TimeRange.EndMin);
    const interval = Number(this.energyJson.Energy.TimeRange.Interval);
    const tickInterval = Number(this.energyJson.Energy.TimeRange['Tick Interval']);
    const endTime = `${startEnd} ${endHour}:${endMin}`;
    const startTime = `${startDate} ${startHour}:${startMin}`;
    const rangeMin = minRange(startTime, endTime);
    const rangeIdx = (rangeMin) / tickInterval;
    const rangeInterval = tickInterval / interval;
    const nullList: any[] = [];   // 製造前面第一個labels~第二個labels之前沒有點
    for (let i = 0; i < rangeInterval; i++) {
      nullList.push(null);
    }
    const labels = [];
    const datasets = [];
    const powerConsumptionList = _.cloneDeep(nullList);
    for (let i = 0; i < rangeIdx + 1; i++) {
      const time: Date = addMinutes(i * tickInterval, startTime);
      const m = time.getMonth();
      const d = time.getDate();
      const hour = time.getHours();
      const min = time.getMinutes();
      if (i !== 0) {
        for (let j = 1; j < rangeInterval; j++) {
          labels.push([]);
          powerConsumptionList.push(this.powerConsumptionwithoutES);
        }
        powerConsumptionList.push(this.powerConsumptionwithoutES);
      }
      labels.push([`${addZero(hour)}:${addZero(min)}`, `${addZero(m + 1)}/${addZero(d)}`]);
    }
    // console.log(labels);


    datasets[0] = {
      label: 'Power Consumption(without ES)',
      data: powerConsumptionList,
      fill: this.fill,
      borderColor: this.energyTotalPowerColor,
      tension: this.tension,
    };
    datasets[1] = {
      label: 'Total Power Consumption',
      data: _.concat(nullList, this.energyJson.Energy.TotalPowerList),
      fill: this.fill,
      borderColor: this.energyColors[0],
      tension: this.tension,
    };
    this.energyJson.Energy.BSPowerList.forEach((row: any, idx: number) => {
      datasets.push({
        label: row['BSName'],
        data: _.concat(nullList, row['PowerList']),
        fill: this.fill,
        borderColor: this.energyColors[idx + 1],
        tension: this.tension
      });
    });
    datasets.forEach((row: any) => {
      row.hidden = !this.energyLegendShow.get(row.label);
    });

    this.energyData = {
      labels: labels,
      datasets: datasets
    };
    this.energyOptions = this.getEnergyOptions();
    this.todayEnergyConsumption = this.energyJson.Energy.TodayEnergyConsumption;
    this.energySaving = this.energyJson.Energy.EnergySaving;
    this.energySavingRatio = this.energyJson.Energy.EnergySavingRatio;
  }

  throughputDataSetting() {
    this.BSNameMapColor = new Map();
    // this.throughputMax = this.throughputJson.Throughput.BSThrpMax;
    const startDate = this.throughputJson.Throughput.TimeRange.StartDate;
    const startEnd = this.throughputJson.Throughput.TimeRange.StartEnd;
    const startHour = Number(this.throughputJson.Throughput.TimeRange.StartHour);
    const startMin = Number(this.throughputJson.Throughput.TimeRange.StartMin);
    const endHour = Number(this.throughputJson.Throughput.TimeRange.EndHour);
    const endMin = Number(this.throughputJson.Throughput.TimeRange.EndMin);
    const interval = Number(this.throughputJson.Throughput.TimeRange.Interval);
    const tickInterval = Number(this.throughputJson.Throughput.TimeRange['Tick Interval']);
    const endTime = `${startEnd} ${endHour}:${endMin}`;
    const startTime = `${startDate} ${startHour}:${startMin}`;
    const rangeMin = minRange(startTime, endTime);
    const rangeIdx = (rangeMin) / tickInterval;
    const rangeInterval = tickInterval / interval;
    const nullList: any[] = [];   // 製造前面第一個labels~第二個labels之前沒有點
    for (let i = 0; i < rangeInterval; i++) {
      nullList.push(null);
    }
    const labels = [];
    const datasets = [];
    for (let i = 0; i < rangeIdx + 1; i++) {
      const time: Date = addMinutes(i * tickInterval, startTime);
      const m = time.getMonth();
      const d = time.getDate();
      const hour = time.getHours();
      const min = time.getMinutes();
      if (i !== 0) {
        for (let j = 1; j < rangeInterval; j++) {
          labels.push([]);
        }
      }
      labels.push([`${addZero(hour)}:${addZero(min)}`, `${addZero(m + 1)}/${addZero(d)}`]);
    }

    datasets[0] = {
      label: 'Total Throughput',
      data: _.concat(nullList, this.throughputJson.Throughput.TotalThrpList),
      fill: this.fill,
      borderColor: this.throughputColors[0],
      tension: this.tension
    };
    this.throughputJson.Throughput.BSThrpList.forEach((row: any, idx: number) => {
      const label = row['BSName'];
      const color = this.throughputColors[idx + 1];
      this.BSNameMapColor.set(label, color)
      datasets.push({
        label: label,
        data: _.concat(nullList, row['ThrpList']),
        fill: this.fill,
        borderColor: color,
        tension: this.tension
      });
    });
    datasets.forEach((row: any) => {
      row.hidden = !this.throughputLegendShow.get(row.label);
    });
    this.throughputData = {
      labels: labels,
      datasets: datasets
    };
    this.throughputOptions = this.getThroughputOptions();

    this.throughputTDList = [];
    this.throughputUEsOfLable = [];
    // 2X2 Array
    let tdLen: number = 0;
    if (this.throughputJson.Throughput.BSUEList.length > 0) {
      const maxAry: number[] = [];
      this.throughputJson.Throughput.BSUEList.forEach((row: any) => {
        maxAry.push(row.UEList.length);
      });
      tdLen = _.max(maxAry) as number;
    }
    this.throughputTDList = [];
    for (let i = 0; i < tdLen; i++) {
      this.throughputTDList[i] = [];
    }

    this.throughputJson.Throughput.BSUEList.forEach((row: any) => {
      console.log(row)
      const column = row['BSName'];
      const color = this.BSNameMapColor.get(column);
      for (let i = 0; i < tdLen; i++) {
        const UE = row['UEList'][i];
        const label = (UE) ? UE : '';
        this.throughputTDList[i].push({
          label: label,
          color: color as string
        });
      }
      this.throughputUEsOfLable.push({
        column: column,
        color: color
      });
    });
    if (this.showTafficTable) this.slideBox();
    // this.resizeThroughArea();
  }

  // Auto Resize Through
  // resizeThroughArea() {
  //   window.setTimeout(() => {
  //     const theadWidth = (document.getElementsByClassName('thead') as any)[0].offsetWidth - 20;
  //     const size = theadWidth / this.throughputUEsOfLable.length;
  //     const thElements = document.querySelectorAll('.thead > span');
  //     const tdElements = document.querySelectorAll('#marquee > div > span');
  //     thElements.forEach((el: any) => {
  //       el.style.width = size + 'px';
  //     });
  //     tdElements.forEach((el: any) => {
  //       el.style.width = size + 'px';
  //     });
  //   }, 0);
  // }

  getThroughThTdWidth(): string {
    const theadWidth = (document.getElementsByClassName('thead') as any)[0].offsetWidth - 20;
    const size = theadWidth / this.throughputUEsOfLable.length;
    return size + 'px';
  }

  // 跑馬燈
  slideBox() {
    clearInterval(this.marquee_setInterval);
    const el = document.getElementById('marquee') as any;
    el.scrollTop = 0;
    let start: number = 0;
    let end: number = 0;
    this.marquee_setInterval = setInterval(() => {
      if (start <= 30) {
        start++;
      } else {
        el.scrollTop += 1;
        if (el.scrollHeight - el.scrollTop === el.clientHeight) {
          if (end <= 30) {
            end++;
          } else {
            el.scrollTop = 0;
            start = 0;
            end = 0;
          }
        }
      }
    }, 100);
  }

  getEnergyOptions(): object {
    // const rangeMapTrue: Map<number, boolean> = new Map();
    // const interval = 10;
    // const total = this.energyMax - this.energyMin;
    // const range = total / interval;
    // for (let i = 0; i < interval + 1; i++) {
    //   rangeMapTrue.set(Math.floor(this.energyMin + range * i), true);
    // }
    // const max = this.energyMax + Math.floor(range);
    return {
      animation: false,
      elements: {
        point: {
          radius: 0
        }
      },
      plugins: {
        legend: {
          // position: 'right',
          // display:false,
          labels: {
            color: '#495057',
            usePointStyle: true,
            pointStyle: 'line',
          },
          onClick: (e: any, legendItem: any, legend: any) => {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
            if (ci.isDatasetVisible(index)) {
              ci.hide(index);
              legendItem.hidden = true;
            } else {
              ci.show(index);
              legendItem.hidden = false;
            }
            this.energyLegendShow.set(legendItem.text, !legendItem.hidden);
          }
        },
        title: {
          display: false,
          text: 'Energy Consumption',
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#495057',
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0
          },
          title: {
            display: true,
            text: 'Time',
          },
          grid: {
            color: '#ebedef'
          }
        },
        y: {
          ticks: {
            color: '#495057',
            // stepSize: range,
            // callback: (value: any) => {
            //   if (rangeMapTrue.get(value)) {
            //     return value;
            //   } else {
            //     return '';
            //   }
            // }
          },
          title: {
            display: true,
            text: 'Power (W)',
          },
          grid: {
            color: '#ebedef'
          },
          // max: max,
          min: this.energyMin
        }
      }
    };
  }

  getThroughputOptions(): object {
    return {
      animation: false,
      elements: {
        point: {
          radius: 0
        }
      },
      plugins: {
        legend: {
          labels: {
            color: '#495057',
            usePointStyle: true,
            pointStyle: 'line',
          },
          onClick: (e: any, legendItem: any, legend: any) => {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
            if (ci.isDatasetVisible(index)) {
              ci.hide(index);
              legendItem.hidden = true;
            } else {
              ci.show(index);
              legendItem.hidden = false;
            }
            this.throughputLegendShow.set(legendItem.text, !legendItem.hidden);
          }
        },
        title: {
          display: false,
          text: 'Taffic Load',
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#495057',
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0
          },
          title: {
            display: true,
            text: 'Time',
          },
          grid: {
            color: '#ebedef'
          }
        },
        y: {
          ticks: {
            color: '#495057',
            // callback: (value: any) => {
            //   if (value === this.powerConsumptionwithoutES + 10) {
            //     return '';
            //   } else {
            //     return value;
            //   }
            // }
          },
          title: {
            display: true,
            text: 'Throughput (Mbps)',
          },
          grid: {
            color: '#ebedef'
          },
          // max: this.throughputMax,
          min: this.throughputMin,
          // offset: true
        }
      }
    };
  }

  getYScale(min: number, max: number): Map<number, boolean> {
    const rangeMapTrue: Map<number, boolean> = new Map();
    const interval = 10;
    const total = max - min;
    const range = total / interval;
    for (let i = 0; i < interval + 1; i++) {
      rangeMapTrue.set(Math.floor(min + range * i), true);
    }
    return rangeMapTrue;
  }

  energyTotalText(): string {
    let str = '';
    if (this.type === 'real_time') {
      str = 'Less 30 Mins';
    } else {
      str = `${this.day} days`;
    }
    return str;
  }
}

function addZero(num: number): string {
  const numStr = num.toString();
  if (numStr.length === 1) {
    return `0${numStr}`;
  } else {
    return numStr;
  }
}

function minRange(start: string, end: string): number {
  var beginDate: any = new Date(start);
  var endDate: any = new Date(end);
  return (endDate - beginDate) / (1000 * 60);
}

function addMinutes(numOfMinutes: number, dateStr: string) {
  const date = new Date(dateStr);
  date.setMinutes(date.getMinutes() + numOfMinutes);

  return date;
}

function fieldJson() {
  return {
    "Field": {
      "XMax": 90.0,
      "YMax": 60.33,
      "BSList": [
        {
          "BSName": "BS1",
          "BSLocX": 83.2,
          "BSLocY": 42.8,
          "Status": "ON"
        },
        {
          "BSName": "BS2",
          "BSLocX": 69.3,
          "BSLocY": 54.7,
          "Status": "ON"
        },
        {
          "BSName": "BS3",
          "BSLocX": 25.8,
          "BSLocY": 54.7,
          "Status": "ON"
        },
        {
          "BSName": "BS4",
          "BSLocX": 76.6,
          "BSLocY": 17.0,
          "Status": "ON"
        },
        {
          "BSName": "BS5",
          "BSLocX": 55.8,
          "BSLocY": 49.9,
          "Status": "OFF"
        },
        {
          "BSName": "BS6",
          "BSLocX": 39.1,
          "BSLocY": 36.4,
          "Status": "OFF"
        },
        {
          "BSName": "BS7",
          "BSLocX": 44.0,
          "BSLocY": 7.2,
          "Status": "OFF"
        },
        {
          "BSName": "BS8",
          "BSLocX": 7.0,
          "BSLocY": 38.1,
          "Status": "OFF"
        }
      ],
      "BSUEList": [
        {
          "BSName": "BS1",
          "UEList": [
            {
              "UEName": "UE12",
              "UELocX": 86.4,
              "UELocY": 42.5
            }
          ]
        },
        {
          "BSName": "BS2",
          "UEList": [
            {
              "UEName": "UE2",
              "UELocX": 59.5,
              "UELocY": 54.8
            },
            {
              "UEName": "UE3",
              "UELocX": 62.7,
              "UELocY": 54.3
            },
            {
              "UEName": "UE4",
              "UELocX": 66.6,
              "UELocY": 55.0
            },
            {
              "UEName": "UE5",
              "UELocX": 47.5,
              "UELocY": 54.7
            },
            {
              "UEName": "UE14",
              "UELocX": 61.5,
              "UELocY": 55.7
            },
            {
              "UEName": "UE15",
              "UELocX": 48.7,
              "UELocY": 56.0
            },
            {
              "UEName": "UE16",
              "UELocX": 64.1,
              "UELocY": 54.4
            },
            {
              "UEName": "UE19",
              "UELocX": 52.2,
              "UELocY": 55.2
            },
            {
              "UEName": "UE21",
              "UELocX": 71.9,
              "UELocY": 55.6
            },
            {
              "UEName": "UE22",
              "UELocX": 72.6,
              "UELocY": 54.7
            },
            {
              "UEName": "UE23",
              "UELocX": 65.3,
              "UELocY": 55.1
            },
            {
              "UEName": "UE29",
              "UELocX": 40.2,
              "UELocY": 53.8
            },
            {
              "UEName": "UE38",
              "UELocX": 42.4,
              "UELocY": 54.0
            },
            {
              "UEName": "UE41",
              "UELocX": 44.9,
              "UELocY": 27.9
            },
            {
              "UEName": "UE42",
              "UELocX": 81.1,
              "UELocY": 39.7
            },
            {
              "UEName": "UE47",
              "UELocX": 50.6,
              "UELocY": 49.7
            },
            {
              "UEName": "UE48",
              "UELocX": 42.3,
              "UELocY": 40.8
            },
            {
              "UEName": "UE49",
              "UELocX": 48.3,
              "UELocY": 36.3
            }
          ]
        },
        {
          "BSName": "BS3",
          "UEList": [
            {
              "UEName": "UE6",
              "UELocX": 27.0,
              "UELocY": 54.6
            },
            {
              "UEName": "UE7",
              "UELocX": 32.4,
              "UELocY": 54.1
            },
            {
              "UEName": "UE8",
              "UELocX": 18.9,
              "UELocY": 54.4
            },
            {
              "UEName": "UE17",
              "UELocX": 20.3,
              "UELocY": 54.0
            },
            {
              "UEName": "UE18",
              "UELocX": 38.6,
              "UELocY": 55.4
            },
            {
              "UEName": "UE20",
              "UELocX": 19.8,
              "UELocY": 56.1
            },
            {
              "UEName": "UE24",
              "UELocX": 23.7,
              "UELocY": 55.4
            },
            {
              "UEName": "UE25",
              "UELocX": 23.7,
              "UELocY": 55.4
            },
            {
              "UEName": "UE26",
              "UELocX": 28.2,
              "UELocY": 55.1
            },
            {
              "UEName": "UE27",
              "UELocX": 33.7,
              "UELocY": 54.7
            },
            {
              "UEName": "UE28",
              "UELocX": 15.4,
              "UELocY": 56.0
            },
            {
              "UEName": "UE33",
              "UELocX": 20.6,
              "UELocY": 55.5
            },
            {
              "UEName": "UE39",
              "UELocX": 17.6,
              "UELocY": 53.8
            },
            {
              "UEName": "UE40",
              "UELocX": 23.7,
              "UELocY": 56.2
            },
            {
              "UEName": "UE43",
              "UELocX": 35.7,
              "UELocY": 39.2
            },
            {
              "UEName": "UE44",
              "UELocX": 17.7,
              "UELocY": 55.2
            },
            {
              "UEName": "UE45",
              "UELocX": 24.3,
              "UELocY": 54.0
            },
            {
              "UEName": "UE46",
              "UELocX": 31.6,
              "UELocY": 55.4
            }
          ]
        },
        {
          "BSName": "BS4",
          "UEList": [
            {
              "UEName": "UE1",
              "UELocX": 81.2,
              "UELocY": 4.7
            },
            {
              "UEName": "UE9",
              "UELocX": 79.1,
              "UELocY": 15.3
            },
            {
              "UEName": "UE10",
              "UELocX": 74.8,
              "UELocY": 8.3
            },
            {
              "UEName": "UE11",
              "UELocX": 76.0,
              "UELocY": 21.6
            },
            {
              "UEName": "UE13",
              "UELocX": 75.1,
              "UELocY": 27.9
            },
            {
              "UEName": "UE30",
              "UELocX": 75.6,
              "UELocY": 19.7
            },
            {
              "UEName": "UE31",
              "UELocX": 76.1,
              "UELocY": 13.3
            },
            {
              "UEName": "UE32",
              "UELocX": 78.2,
              "UELocY": 24.5
            },
            {
              "UEName": "UE34",
              "UELocX": 77.9,
              "UELocY": 6.0
            },
            {
              "UEName": "UE35",
              "UELocX": 75.0,
              "UELocY": 11.9
            },
            {
              "UEName": "UE36",
              "UELocX": 75.7,
              "UELocY": 23.3
            },
            {
              "UEName": "UE37",
              "UELocX": 75.0,
              "UELocY": 9.8
            },
            {
              "UEName": "UE50",
              "UELocX": 26.8,
              "UELocY": 36.4
            }
          ]
        },
        {
          "BSName": "BS5",
          "UEList": []
        },
        {
          "BSName": "BS6",
          "UEList": []
        },
        {
          "BSName": "BS7",
          "UEList": []
        },
        {
          "BSName": "BS8",
          "UEList": []
        }
      ]
    }
  }
}

// function fieldJson() {
//   return {
//     "Field":
//     {
//       "XMax": 40,
//       "YMax": 40,
//       "BSList":
//         [
//           {
//             "BSname": "BS1", "BSLocX": 100, "BSLocY": 100, "Status": "ON"
//           },
//           {
//             "BSname": "BS2", "BSLocX": 200, "BSLocY": 100, "Status": "ON"
//           },
//           {
//             "BSname": "BS3", "BSLocX": 300, "BSLocY": 100, "Status": "OFF"
//           }
//         ],
//       "BSUEList":
//         [
//           {
//             "BSname": "BS1",
//             "UEList":
//               [
//                 {
//                   "UEName": "UE1", "UELocX": 100, "UELocY": 4.3
//                 },
//                 {
//                   "UEName": "UE2", "UELocX": 130, "UELocY": 4.2
//                 },
//                 {
//                   "UEName": "UE3", "UELocX": 160, "UELocY": 4.5
//                 }
//               ]
//           },
//           {
//             "BSname": "BS2",
//             "UEList":
//               [
//                 {
//                   "UEName": "UE4", "UELocX": 200, "UELocY": 4.8
//                 },
//                 {
//                   "UEName": "UE5", "UELocX": 230, "UELocY": 6.2
//                 },
//                 {
//                   "UEName": "UE6", "UELocX": 260, "UELocY": 6.5
//                 }
//               ]
//           }
//         ]
//     }

//   }
// }

function energyJson() {
  return {
    "Energy":
    {
      "TimeRange":
      {
        "StartDate": "2022-09-28",
        "StartHour": 22,
        "StartMin": 0,
        "StartEnd": "2022-09-28",
        "EndHour": 23,
        "EndMin": 30,
        "Interval": 10,
        "Tick Interval": 30
      },
      "BSPowerList":
        [
          {
            "BSName": "BS1",
            "PowerList": [275, 312, 333, 231, 231, 275, 312, 333, 231, 231, 275, 312, 333, 231, 231, 275, 312, 333, 231, 231]
          },
          {
            "BSName": "BS2",
            "PowerList": [265, 302, 313, 212, 212, 265, 302, 313, 212, 212, 265, 302, 313, 212, 212, 265, 302, 313, 212, 212]
          }
        ],
      "TotalPowerList": [540, 614, 646, 443, 44, 540, 614, 646, 443, 44, 540, 614, 646, 443, 44, 540, 614, 646, 443, 44],
      "PowerConsumptionwithoutES": 800,
      "TodayEnergyConsumption": 2750,
      "EnergySaving": 1070,
      "EnergySavingRatio": 28
    }
  }
}

function throughputJson() {
  return {
    "Throughput":
    {
      "TimeRange":
      {
        "StartDate": "2022-09-27",
        "StartHour": 17,
        "StartMin": 0,
        "StartEnd": "2022-09-27",
        "EndHour": 19,
        "EndMin": 5,
        "Interval": 10,
        "Tick Interval": 30
      },
      "BSThrpList":
        [
          {
            "BSName": "BS1",
            "ThrpList": [275, 312, 333, 231, 231, 275, 312, 333, 231, 231, 275, 312, 333, 231, 231, 275, 312, 333, 231, 231]
          },
          {
            "BSName": "BS2",
            "ThrpList": [265, 302, 313, 212, 212, 265, 302, 313, 212, 212, 265, 302, 313, 212, 212,]
          }
        ],
      "TotalThrpList": [540, 614, 646, 443, 443, 540, 614, 646, 443, 443, 540, 614, 646, 443, 443, 540, 614, 646, 443, 443],
      "BSUEList":
        [
          {
            "BSName": "BS1",
            "UEList": ["UE1", "UE2", "UE3"]
          },
          {
            "BSName": "BS2",
            "UEList": ["UE4", "UE5", "UE6"]

          }
        ]

    }
  }

}

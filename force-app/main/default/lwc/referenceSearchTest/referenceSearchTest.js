import { LightningElement, api, track, wire } from 'lwc';
import getInit from '@salesforce/apex/ReferenceSearchController.getInit';
import getDataByFilter from '@salesforce/apex/ReferenceSearchController.getDataByFilter';
// import { resetValue } from './searchsh.js';


export default class ReferenceSearch extends LightningElement {
    @api title = '기본제목';
    @track isKorean = false;
    @track isEnglish = false;
    @track result = [];
    @track loaded = false;

    refAllData = []; 
    supCallsList = [];
    supCallsItems = []; // supported calls 항목들

    // 초기화면 세팅
    @wire(getInit)
    wiredInit({ error, data }) {
        if (data && data.result) {
            console.log('wiredInit >>>>>>>>>>>>>>> 데이터 받아옴');
            this.refAllData = data.result.refAllData;
            this.initialData = [...this.refAllData];  // 복사본 생성, 리셋에 사용
            this.supCallsList = data.result.callList;
            this.supCallsItems = this.supCallsList.map(val => {
                val = val.replace('()', '');
                return { label: `${val}`, name: `${val}`, checked: false };
            });

            this.setTable();

        } else if (error) {
            console.error('Error:', error);
        }
    }

    setTable(refData){
        // 로딩 시작
        this.loaded = false;
        console.log("setTable start >>>>>>>>>>>>>>>>>>>> loaded:state : " + this.loaded )
        if(!refData) {
            refData = this.refAllData;
        }
        if (Array.isArray(refData)) {
            this.refAllData = refData;
            //로딩 끝
            this.loaded = true; 
            console.log("setTable end >>>>>>>>>>>>>>>>>>>> loaded:state : " + this.loaded )

        } else {
            console.error('refData : ', refData);
        }
    }
    
    // this.name을 파라미터로 apex 클래스에 전달후, 응답을 받고 data를 테이블 형식으로 페이지에 렌더링
    btnSearch() {
        console.log("btnSearch 시작")
        const name = this.template.querySelector('[data-id="name"]').value;
        const description = this.template.querySelector('[data-id="description"]').value;
        const apiversion = this.template.querySelector('[data-id="apiversion"]').value;
        const specialAccessRules = this.template.querySelector('[data-id="specialAccessRules"]').value;
        const usage = this.template.querySelector('[data-id="usage"]').value;
        const memo = this.template.querySelector('[data-id="memo"]').value;
        const isKorean = this.isKoreanText(name);
        const isEnglish = this.isEnglishText(name);
        let supportedCalls = '';
        // 체크박스 체크 여부 확인 후 supportedCalls 문자열에 추가
        const checkboxes = this.template.querySelectorAll('.selectedCheckbox');
        
        checkboxes.forEach((checkbox, idx) => {
            if(checkbox.checked) {
                if(idx == checkboxes.length-1){
                    supportedCalls += checkbox.name + '()';
                } else {
                    supportedCalls += checkbox.name + '();';
                }
            }
        });
        console.log('supportedCalls >>>>>>>>>>>>> ', supportedCalls);

        // 현재 삭제된 API 여부 확인 
        const removeChecked = this.template.querySelector('[data-id="remove"]');
        const remove = removeChecked.checked;
        console.log("remove >>>>>>>> " +remove)
        
        if (description && description.length < 2) {
//Alert lightning-toast 로 추후 변경 ********************************************************************
            alert('Description은 2글자 이상이어야 합니다.');
            return; 
        }

        // filterGroup에 값을 저장하여 백엔드로 전달
        let filterGroup = {
            ApiVersion: apiversion,
            SupportedCalls: supportedCalls,
            Description: description,
            Remove: remove,
            SpecialAccessRules: specialAccessRules,
            Usage: usage,
            Memo: memo
        };

        console.log("filterGroup : " + JSON.stringify(filterGroup));

        // Name input 영역에 입력된 값이 한글인지 영어인지를 구분해서 서로 다른 필드로 전달
        if(isKorean) {
            filterGroup.KorLabel = name;  // 한글일 경우 KorLabel 키값에 텍스트 할당
        } else if(isEnglish) {
            if(this.hasWhitespaceInMiddle()) {
                filterGroup.EngLabel = name;  //  공백이 있는 영어일 경우 EngLabel 키값에 텍스트 할당
            } else {
                filterGroup.Name = name;  // 공백이 없는 영어인 경우 Name 키값에 텍스트 할당
            }
        }

        getDataByFilter({ filterGroup: JSON.stringify(filterGroup) })
            .then(result => {
                if(result.success == true){
                    console.log("rsult data : " , result.result);
                    this.setTable(result.result);
                } else {
                    console.error('result error : ', error);
                }
            })
            .catch(error => {
                console.error(' getDataByFilter 에러 : ', error);
            });
    }
    
    isKoreanText(text) {
        const koreanRegex = /[가-힣]/;
        return koreanRegex.test(text);
    }
    isEnglishText(text) {
        const englishRegex = /^[a-zA-Z\s]+$/;
        return englishRegex.test(text);
    }

    // 입력받은 텍스트가 영어일 때 공백여부를 확인하기 위한 함수
    hasWhitespaceInMiddle() {
        let name = this.template.querySelector('[data-id="name"]').value;
        const str = name;
        let result = false;
        // 문자열 중간에 있는 공백 여부 확인
        for (let i = 0; i < str.length; i++) {
            if (str[i] === ' ') {
                result = true; // 중간에 공백이 있으면 true 반환
            }
        }
        return result;
    }

    // 특정 클래스 이름 할 떄 + enter 시 검색
    checkKey(event){
        if((event.target.classList.contains('inputValue') || event.target.classList.contains('selectedCheckbox')) && event.key === "Enter"){
            this.btnSearch();
            console.log("enter")
        }
    }

    btnReset(){
        console.log("초기화 시작 >>>>>>>>>>>>>>>>>>>>> btnReset"); 
        //셀렉박스 초기화
        const checkboxes = this.template.querySelectorAll('.selectedCheckbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            console.log("checkbox : ", checkbox.checked);
        });
    
        //인풋박스 초기화
        const inputboxes = this.template.querySelectorAll('.inputValue');
        inputboxes.forEach(inputbox => {
            inputbox.value = '';
            console.log("inputbox : ", inputbox.value);
        });

        //복사한 첫 데이터 가져옴
        this.setTable(this.initialData);
    }
}
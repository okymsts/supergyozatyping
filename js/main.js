'use strict'
{
  //===========================================================
  // Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  //===========================================================
  var firebaseConfig = {
    apiKey: "AIzaSyCVKF3hm2azM-IrpFBwGGKN4HCnzEwcXso",
    authDomain: "supergyozatyping-65b80.firebaseapp.com",
    projectId: "supergyozatyping-65b80",
    storageBucket: "supergyozatyping-65b80.appspot.com",
    messagingSenderId: "973137691855",
    appId: "1:973137691855:web:59aa4c5f71e065652123ba",
    measurementId: "G-XX2MZE7T28",  
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  firebase.analytics();
  const db = firebase.firestore();
  const collection = db.collection('scores');
  //===========================================================
  //宣言
  //===========================================================
  //入力文字位置, ミスタイプ数, 総タイプ数, 正解打数(スコア用)
  let loc = 0, missTypeCnt = 0, totalTypeCnt = 0, correctTypeCnt = 0;  
  let isPlaying = false; //正誤判定の処理要否を制御
  let allowStartFlg = true; //ゲームスタート処理制御（ゲーム開始前のみ可能）
  let pre2Char = ['','']; //２つ前までの入力文字保持（複数通り入力許容用）
  let next2Char = ['',''] //２つ先までのtarget文字保持（複数通り入力許容用）
  let scoreCalc = 0;

  const playWindow = document.getElementById('playWindow'); //プレイウインドウ  
  const setGoStr = document.getElementById('setGoStr'); //”よーい”、”はじめ”文字
  const targetKana = document.getElementById('targetKana'); //入力文字列 かな
  const targetRomaji = document.getElementById('targetRomaji'); //入力文字列 ローマ字  
  const playingScore = document.getElementById('playingScore'); //プレイ中スコア表示
  const timeLimit = document.getElementById('timeLimit'); //残り時間表示
  const missType = document.getElementById('missType'); //ミスタイプ数表示
  const totalType = document.getElementById('totalType'); //総タイプ数表示
  const rank = document.getElementById('rank'); //ランク表示
  const backBtn = document.getElementById('backBtn');//戻るボタン
  const mask = document.getElementById('mask'); //マスク
  const ranking = document.getElementById('ranking');
  const userName = document.getElementById('userName'); 
  let wordPair = [];
  //==============================================
  //★MAIN処理★
  //==============================================

  showRanking();

  //★プレイ時間ボタン'Click'時class切替★
  const selectBtns = document.querySelectorAll('.timeLimitChoices .btn');
  selectBtns.forEach(clickedBtn => {
    clickedBtn.addEventListener('click', () =>{
      selectBtns.forEach(btn =>{
        btn.classList.remove('active');
      });
      clickedBtn.classList.add('active');      
    });
  });

  //★キー入力★
  document.addEventListener('keydown', e =>{ 
    // 【Esc】 
    if(e.key === 'Escape'){ 
      displayIni(); //Esc押下時はいつでも初期化
      return;
    }
    // 【スペース】
    if(e.key === ' '){     
      if( allowStartFlg ){        
        setGo();
        allowStartFlg = false;
      }
      return; 
    }
    //プレイ開始前は[Esc, Space]以外のkey無視
    if(!isPlaying) {
      return; 
    }
    //【Shift】は無視
    if(e.key === 'Shift') {      
      return 
    }
    //正誤判定
    if(checkKey(e.key)){
      correct(e.key);      
    }else{
      miss();
    }
    totalTypeCnt++
    //文章のラスト１文字入力時
    if(loc === targetRomaji.textContent.length){ 
      typeLastChar();      
    }
  });

  //★戻るボタンClick★
  backBtn.addEventListener('click', () =>{  
    registScore();
    displayIni(); 
  });

  //===========================================================
  //●ファンクション●
  //===========================================================

  //●正誤判定処理●
  function checkKey(key){   
    const targetChar = targetRomaji.textContent[loc];
    //正打
    if(key === targetChar){
      setLoc('',0);
      return true;
    }
    // ======================================
    // 以下targetCharと異なるkeyの許容
    // ======================================
    if(key === 'c'){      
      //『許容』k → c ※「targetが k」
      if( targetChar === 'k' ){
        // 「次文字が a, u, o 」（ka, ku, ko → ca, cu, co)
        if(['a','u','o'].includes(next2Char[0])){
          setLoc('',0);
          return true;
        // 「次2文字が ka, ku, ko 」(kka,kku,kko → cca, ccu, cco）
        }else if(['ka','ku','ko'].includes(next2Char.join(''))){
          setLoc('c',1);
          return true;
        }
      }
      //『許容』s → c ※「targetが s」
      if( targetChar === 's' ){
        // 「次文字が i, e 」（si, se → ci, ce)        
        if(['i','e'].includes(next2Char[0])){
          setLoc('',0);
          return true;
        // 「次2文字が si, se 」(ssi, sse → cci, cce)
        }else if(['si','se'].includes(next2Char.join(''))){
          setLoc('c',1);
          return true;
        }
      }
      //『許容』t → c  ※「targetが t」「keyが c」
      if( targetChar === 't'){
        // 「次文字が i」（ti → chi)              
        if(next2Char[0] === 'i' ){          
          setLoc('h',0);
          return true;
        // 「次2文字が ti 」(tti → cchi)
        }else if(next2Char.join('') === 'ti'){
          setLoc('ch',1);
          return true;
        // 「次文字が y 」(tya,tyi,tyu,tye,tyo → cya,cyi,cyu,cye,cyo)
        }else if(next2Char[0] === 'y'){
          setLoc('',0);
          return true;  
        // 「次2文字が ty 」(ttya,ttyi,ttyu,ttye,ttyo → ccya,ccyi,ccyu,ccye,ccyo)
        }else if(next2Char.join('') === 'ty'){
          setLoc('c',1);
          return true;
        }
      }
    }  
    if(key === 'h'){
      //『許容』e → h （we → whe）
      //「targetがe」「前文字がw」      
      if(targetChar === 'e' && pre2Char[0] === 'w'){
        setLoc('',-1);
        return true;
      }
      //『許容』f → h ※「targetがf」
      if( targetChar === 'f'){
        //「次文字が u 」（fu → hu)
        if(next2Char[0] === 'u'){
          setLoc('',0);
          return true;
        //「次2文字が fu 」(ffu → hhu）              
        }else if(next2Char.join('') === 'fu'){
          setLoc('h',1);
          return true;
        }
      }
      //『許容』i → h （si, wi → shi, whi）
      // 「targetが i 」「keyが h 」「前文字が s , w」      
      if( targetChar === 'i' && ['s','w'].includes(pre2Char[0])){
        setLoc('',-1);
        return true;
      }
      //『許容』y → h
      // 「targetが y」「前文字が c, s」「次文字が a,u,e,o」
      // (cya,cyu,cye,cyo(sya,syu,sye,syo)→cha,chu,che,cho(sha,shu,she,sho))
      if(targetChar === 'y' && ['c','s'].includes(pre2Char[0]) && ['a','u','e','o'].includes(next2Char[0]) ){
        setLoc('',0);
        return true;
      }
    }
    if(key === 'n'){
      // 『許容』”ん'の nn 入力
      //「targetが子音('y'を除く)」「前文字が'n'」「前２文字が'nn'でない」      
      if( !(['a','i','u','e','o','y'].includes(targetChar)) && pre2Char[0] === 'n' && !(['nn','nx'].includes(pre2Char.join(''))) ) {
        setLoc('',-1);
        return true;
      }
    }
    if(key === 's'){
      //『許容』u → s （tu → tsu）
      if(targetChar === 'u' && pre2Char[0] === 't'){
        setLoc('',-1);
        return true;
      }      
    }
    if(key === 'x'){
      // 『許容』”ん'の xn 入力
      if(targetChar === 'n' 
      && !( ['x','n'].includes(pre2Char[0])) 
      && !(['a','i','u','e','o','y'].includes(next2Char[0])) ){      
          if(next2Char[0] === 'n'){
            setLoc('',0);
          }else{
            setLoc('',-1);    
          }         
          return true;
      }
    }
    if(key === 'y'){      
      //『許容』a,u,o → y （ja,ju,je,jo → jya,jyu,jye,jyo）
      //「targetがa,u,e,oのいずれか」「前文字がj」
      if( ['a','u','e','o'].includes(targetChar) && pre2Char[0] === 'j'){
        setLoc('',-1);
        return true ;
      }
    }
    if(key === 'z'){
      //『許容』j → z  ※「targetが j 」
      if( targetChar === 'j'){
        // 「次文字が a, u, e, o」(ja,ju,je,jo → zya,zyu,zye,zyo)
        if(['a','u','e','o'].includes(next2Char[0]) ){
          setLoc('y',0);
          return true;
        // 「次2文字が ja, ju, je, jo」（jja,jju,jje,jjo → zzya,zzyu,zzye,zzyo）
        }else if(['ja','ju','je','jo'].includes(next2Char.join(''))){
          setLoc('zy',1);
          return true;
        // 「次文字が i」（ji → zi） 「次文字が y」(jyi,jye → zyi,zye)
        }else if(['i','y'].includes(next2Char[0]) ){
          setLoc('',0);
          return true;
        // 「次2文字が ji」（jji → zzi）「次2文字が jy」（jjyi,jjye → zzyi,zzye）
        }else if(['ji','jy'].includes(next2Char.join('')) ){
          setLoc('z',1)
          return true;
        }
      }
    }
    //ここまで抜けたらミスタイプ
    return false;
  }
  //●正打時のloc調整処理●
  function setLoc(insertChar = '',locIncrement = 0){
    loc++;
    targetRomaji.textContent = '_'.repeat(loc) + insertChar + targetRomaji.textContent.substring(loc + locIncrement);
  }
  //●正打処理●
  function correct( key ){
    pre2Char.pop();
    pre2Char.unshift(key);//２つ前までの正打文字を保持
    next2Char.shift();
    next2Char.push(targetRomaji.textContent[loc+2]); //２つ先までのtarget文字を保持
    document.getElementById('correctSound').currentTime = 0;
    document.getElementById('correctSound').play();
  }
  //●誤打処理●
  function miss(){
    document.getElementById('missSound').currentTime = 0;
    document.getElementById('missSound').play();
    scoreCalc = scoreCalc - 7;
    playingScore.textContent = `餃子愛　${scoreCalc} love`;    
    scoreTextEffect(false); //スコア装飾
    missTypeCnt++;
  }
  //●文章のラスト１文字入力時処理●
  function typeLastChar(){
    //スコア用の正打数カウントアップ
    scoreCalc = scoreCalc + targetRomaji.textContent.length;
    playingScore.textContent = `餃子愛　${scoreCalc} love`;    
    scoreTextEffect(true);//スコア装飾
    //全文章入力終了時,再シャッフル
    if(currentNum === wordPair.length -1){
      wordPair = shuffle(wordPair);
      currentNum = -1;
    }
    //次の文章をセット    
    currentNum++;
    setWord();
    document.getElementById('nextSound').play();
    pre2Char.fill('')
    next2Char = [targetRomaji.textContent[loc+1],targetRomaji.textContent[loc+2]];
  }
  //●入力文字列シャッフル処理●
  function shuffle(arr){
    for(let i = arr.length - 1; i>0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [arr[j],arr[i]] = [arr[i],arr[j]]
    }
    return arr;
  }
  //●入力文字列セット処理●
  let currentNum = 0; //入力文字列の順番
  function setWord(){
    targetKana.textContent = wordPair[currentNum].k;
    targetRomaji.textContent = wordPair[currentNum].r;
    loc = 0;
  }
  //●ゲーム開始前カウントダウン処理●
  let setGoIntervalId;
  function setGo(){ 
        
    //プレイウインドウ表示
    playWindow.classList.remove('hidden');
    mask.classList.remove('hidden');
    setGoStr.classList.add('biyon');
 
    var sec = 2; //カウントする秒数
    setGoIntervalId = setInterval(function(){
      sec--;
      if(sec <= 1){
        setGoStr.classList.remove('biyon');
        setGoStr.classList.add('buruburu');
        setGoStr.textContent = 'はじめ！！';
        document.getElementById('startSound1').play();
        document.getElementById('startSound2').play(); 
      }
      if(sec <= 0){
        clearInterval(setGoIntervalId); 
        gameStart();
        playTimer();
        return;
      } 
    }, 1000 );
  }
  //●ゲーム開始処理●
  function gameStart(){    
    wordPair = shuffle([//入力対象文字列群
      // {k:'', r:''},
      {k:'しそ餃子', r:'sisogyouza'},
      {k:'ニラ餃子', r:'niragyouza'},
      {k:'焼き餃子', r:'yakigyouza'},
      {k:'蒸し餃子', r:'musigyouza'},
      {k:'水餃子', r:'suigyouza'},
      {k:'揚げ餃子', r:'agegyouza'},
      {k:'昨日も食べた', r:'kinoumotabeta'},
      {k:'明日も食べる', r:'asitamotaberu'},
      {k:'花より餃子', r:'hanayorigyouza'},
      {k:'腐っても餃子', r:'kusattemogyouza'},    
      {k:'皿は楕円形で', r:'sarahadaenkeide'},
      {k:'餃子と目があった', r:'gyouzatomegaatta'},
      {k:'チャオズって言うらしい', r:'tyaozutteiurasii'},
      {k:'藪から棒餃子', r:'yabukarabougyouza'},
      {k:'餃子はよく焼きで', r:'gyouzahayokuyakide'},      
      {k:'円形に盛るとアがる', r:'enkeinimorutoagaru'},
      {k:'ラー油勝手に入れるな', r:'ra-yukatteniireruna'},
      {k:'ビールとの相性すごい', r:'bi-rutonoaisyousugoi'},
      {k:'ぎょうざ漢字で書けます', r:'gyouzakanjidekakemasu'},
      {k:'皮やぶって冷ましとくね', r:'kawayabuttesamasitokune'},    
      {k:'今日はワインをあわせちゃう', r:'kyouhawainwoawasetyau'},
      {k:'夢でも餃子を食べた', r:'yumedemogyouzawotabeta'},
      {k:'太ったのは餃子のせい', r:'futottanohagyouzanosei'},
      {k:'タレをつけないで食うやつ', r:'tarewotukenaidekuuyatu'},
      {k:'二度焼くやつは三度焼く', r:'nidoyakuyatuhasandoyaku'},
      {k:'焼き小籠包がライバル', r:'yakisyouronpougaraibaru'},
      {k:'マヨネーズつけて食うやつ', r:'mayone-zutuketekuuyatu'},    
      {k:'餃子にチーズは入れないで', r:'gyouzaniti-zuhairenaide'},
      {k:'飼い犬に餃子を食われる', r:'kaiinunigyouzawokuwareru'},
      {k:'餃子も鉄板から落ちる',  r:'gyouzamoteppankaraotiru'},
      {k:'羽根つき餃子が羽ばたいた', r:'hanetukigyouzagahabataita'},
      {k:'冷凍餃子なめたらあかんぜよ', r:'reitougyouzanametaraakanzeyo'},
      {k:'白菜かキャベツかで揉めた', r:'hakusaikakyabetukademometa'},
      {k:'鬼に金棒、餃子は相棒', r:'oninikanabou,gyouzahaaibou'},
      {k:'包まぬ餃子の皮算用', r:'tutumanugyouzanokawazannyou'},    
      {k:'目には目を、餃子にはタレを', r:'menihamewo,gyouzanihatarewo'},    
      {k:'餃子を枕にしてみたら?', r:'gyouzawomakuranisitemitara?'},
      {k:'大きいけど三個しか入ってない',r:'ookiikedosankosikahaittenai' },
      {k:'恋のキューピットは餃子でした', r:'koinokyu-pittohagyouzadesita'},
      {k:'来世でも餃子を包んでいたい', r:'raisedemogyouzawotutundeitai'},
      {k:'餡が余ったらハンバーグにしよう', r:'angaamattarahanba-gunisiyou'},    
      {k:'餃子を発明した人だれ？', r:'gyouzawohatumeisitahitodare?'},
      {k:'警棒、、、じゃなくて棒餃子か', r:'keibou,,,janakutebougyouzaka'},
      {k:'拍手じゃなくて餃子焼いてんの', r:'hakusyujanakutegyouzayaitennno'},
      {k:'餃子の皮でピザ作らされた', r:'gyouzanokawadepizatukurasareta'},
      {k:'泣き面に蜂、でも餃子で笑顔', r:'nakituranihati,demogyouzadeegao'},
      {k:'一口餃子を二口でたべる', r:'hitokutigyouzawofutakutidetaberu'},    
      {k:'ニンニク無し餃子のことなめてた', r:'ninnnikunasigyouzanokotonameteta'},
      {k:'餃子一人前で百万円です', r:'gyouzaitininmaedehyakumannendesu'},
      {k:'一週間餃子しか食べてない（ウソ）', r:'issyuukangyouzasikatabetenai(uso)'},
      {k:'中国では餃子といえば水餃子', r:'tyuugokudehagyouzatoiebasuigyouza'},
      {k:'彼は餃子をおつまみとしてみてる', r:'karehagyouzawootumamitositemiteru'},    
    ]);    
    isPlaying = true;
    setGoStr.textContent = '';
    setGoStr.classList.remove('buruburu');
    setWord();
    playingScore.textContent = `餃子愛　${scoreCalc} love`;
    next2Char = [targetRomaji.textContent[loc+1],targetRomaji.textContent[loc+2]];
    document.querySelector('#playWindow .playingContents').classList.remove('hidden');
  }
  //●プレイ制限時間カウントダウン●
  let playTimerId;
  function playTimer(){
    //プレイ制限時間取得    
    const playTime = document.querySelector('.timeLimitChoices .btn.active').dataset.playtime;
    //開始時刻
    const startTime = Date.now();
    //プレイ時間カウントダウン
    playTimerId = setInterval(() => {

    const curtTime = Date.now(); 
    const diff = curtTime - startTime; //差分（経過）を取得
    const remainTime = playTime - diff
    const remainTimeStr = String(playTime - diff).padStart(5,'0'); 
    const remainS = remainTimeStr.substr(0,2);  //秒 文字列取得
    const RemainMs = remainTimeStr.substr(2,2); //ﾐﾘ秒 文字列取得

    timeLimit.textContent = `残り時間　${remainS}.${RemainMs}`; //画面に表示

    if(remainTime < 0){        
      clearInterval(playTimerId);
      isPlaying = false;
      showResult();
    }

  }, 10);
     
  }
  //●結果表示処理●
  let resultTimeoutId;
  function showResult() {
    //サウンド と 終了文字表示
    document.getElementById('finishSound').play();
    setGoStr.textContent = 'やめ！！';
    setGoStr.classList.add('buruburu');
    setGoStr.style.zIndex = 10;    
    document.querySelector('#playWindow .playingContents').classList.add('hidden');
    
    //１秒後に各結果項目表示
    resultTimeoutId = setTimeout( function() {
      setGoStr.textContent = '';
      document.querySelector('#playWindow .resultContents').classList.remove('hidden');
      //タイプ数表示
      missType.textContent  = `ミスタイプ数：${missTypeCnt} 打`;
      totalType.textContent = `総タイプ数：${totalTypeCnt} 打`;      
      //餃子愛(score)の計算・表示
      document.getElementById('resultScore').textContent = `餃子愛：${scoreCalc} love`;
      //Ranking10位以上の場合、名前登録可能
      collection.orderBy('score','desc').limit(10).get().then(querySnapshot =>{
        const tenthScore = querySnapshot.docs[querySnapshot.docs.length-1].data().score;
        if(scoreCalc > tenthScore){
          document.querySelector('#scoreRegist span').textContent = 'ランクイン！！';
          userName.focus();
          backBtn.textContent = '登録して戻る';
        }else{
          backBtn.textContent = '戻る';
          userName.classList.add('hidden');
        }
      });
      //ランク判定・表示
      var rankStr = '';
      if (450 <= scoreCalc )      rankStr = 'S 『 餃子の王将 』';
      else if (350 <= scoreCalc ) rankStr = 'A 『 餃子の生まれ変わり 』';
      else if (250 <= scoreCalc ) rankStr = 'B 『 餃子の師匠 』';
      else if (150 <= scoreCalc ) rankStr = 'C 『 餃子の先輩 』';
      else if (100 <= scoreCalc ) rankStr = 'D 『 餃子の友達 』';
      else if (  0 <  scoreCalc ) rankStr = 'E 『 餃子の付き人 』';
      else                        rankStr = 'F 『 餃子食べたことない人 』';
      rank.textContent = `ランク ${rankStr}`;
      
    } , 1000 );

  }
  //●スコア登録●
  function registScore(){
    const val = userName.value;
    if(val === ''){
      return;
    }
    userName.value = '';
    collection.add({
      username: val,
      score: scoreCalc
    })
    .then(doc => {
      console.log(`スコアを登録しました（${doc.id}）`);
    })
    .catch(error => {
      console.log('document add error!');
      console.log(error);
    });
  }

  //●ランキング表示●
  function showRanking(){
    while(ranking.rows[0]){
      ranking.deleteRow(0);
    }
    collection.orderBy('score','desc').limit(10).get().then(querySnapshot =>{
      let i = 1;
      querySnapshot.forEach(doc =>{
        const d = doc.data();
        const tr = document.createElement('tr');
        const td1 = document.createElement('td');
        const td2 = document.createElement('td');
        const td3 = document.createElement('td');
        td1.textContent = i;        
        td2.textContent = d.username;
        td3.textContent = d.score;
        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        ranking.appendChild(tr);
        i++;      
      });
    });    
  }
  //●初期化処理●
  function displayIni(){    
    //タイマークリア==========================
    clearInterval(setGoIntervalId);
    clearInterval(playTimerId);
    clearTimeout(resultTimeoutId);        
    //各文字列初期化==========================
    pwChildTextClear();
    wordPair = shuffle(wordPair);
    setGoStr.textContent = 'よ～い';
    //開始サウンド停止==========================
    document.getElementById('startSound1').pause();
    document.getElementById('startSound2').pause();
    document.getElementById('startSound1').currentTime = 0;
    document.getElementById('startSound2').currentTime = 0;
    //スタイル初期化==========================
    setGoStr.classList.remove('buruburu','biyon');
    playWindow.classList.add('hidden');
    playingScore.className ="";
    document.querySelector("#playWindow .playingContents").classList.add('hidden');
    document.querySelector("#playWindow .resultContents").classList.add('hidden');
    userName.classList.remove('hidden');
    mask.classList.add('hidden');
    //フラグ・カウント初期化==========================
    allowStartFlg = true;
    isPlaying = false;
    loc = 0;
    currentNum = 0;
    scoreCalc = 0;
    missTypeCnt = 0;
    correctTypeCnt = 0;
    totalTypeCnt = 0;
    pre2Char.fill('');
    next2Char.fill('');
    //Ranking再表示==========================
    showRanking();
  }
  //●プレイウインドウ文字初期化●
  function pwChildTextClear(){
    document.querySelectorAll('#playWindow li').forEach( li => {
      if(['scoreRegist'].includes(li.id)){
        document.querySelector('#scoreRegist span').textContent = '';
      }else{
        li.textContent = "";
      }
    });
  };
  //●score文字の加算・減算時の装飾●
  function scoreTextEffect( correct = false){
    playingScore.className ="";
    window.requestAnimationFrame(function(time){
      window.requestAnimationFrame(function(time){
        if (correct){
          playingScore.className = 'textShining';
        }else{
          playingScore.className = 'textDark';
        }
      })
    });
  }

}
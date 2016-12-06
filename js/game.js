'use strict';
var requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
})();

//创建canvas对象，全屏
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = document.body.scrollWidth;
canvas.height = document.body.scrollHeight;
document.body.appendChild(canvas);

// main为主循环，每一帧都重绘
var lastTime;
var playAgain = document.querySelector("#playAgain");
var playStart = document.querySelector("#playStart");
var gameStart = document.querySelector("#gameStart");
var gameO     = document.querySelector("#gameOver");
var SC        = document.querySelector("#SC");
var nickname  = document.querySelector("#nickname");
var user = {
    nicname:0,
    score:0
}
function main() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;

    update(dt);
    render();
    lastTime = now;
    count++;
    if(destroy == 100) {
        gameOver();
    }
    requestAnimFrame(main);
};
//init为游戏初始化，创建背景，小精灵归零
function init() {
    reset();
    terrainPattern = ctx.createPattern(resources.get('img/yq1.png'), 'repeat');
    playAgain.addEventListener('click', function() {
        reset();
    });
    playStart.addEventListener('click', function () {
        if(nickname.value != ''){
            lastTime = Date.now();
            user.nicname = nickname.value;
            main();
            gameStart.style.display = "none";
        }
    });
}
//加载图片

resources.load([
    'img/yq1.png',
    'img/sprite.png'
]);
resources.onReady(init);

//游戏对象及各部分熟悉
var bulletMove= ['left', 'down', 'right', 'up'];
var blackMove = ['up','down', 'right', 'left', 'up_left', 'up_right', 'down_right', 'down_left'];
var choiceM=2;
var player = {
    pos: [0, 0],
    sprite: new Sprite('img/sprite.png', [0, 363], [70, 70], 16, [0])
};

var bullets = []; //子弹集
var blackbullets = [];
var enemies = []; //敌人集
var bigenemies = [];   //big敌人 
var explosions = [];  //爆炸动画

var lastFire = Date.now();
var gameTime = 0;
var isGameOver;
var terrainPattern;
var energy = 0;
var energyCount = 0;
var count;
var big = 0;
var destroy = 0;

var score = 0;

var playerSpeed = 300;
var bulletSpeed = 500;
var enemySpeed = 100;

//更新游戏时间，各部分属性，创建新的敌人
function update(dt) {
    gameTime += dt;

    handleInput(dt);
    updateEntities(dt);
    if (count == 100) {
        createEnemy(enemies,'small');
        for(var i = 0; i < enemies.length; i++) {
            var x = enemies[i].pos[0] + enemies[i].sprite.size[0] / 2;
            var y = enemies[i].pos[1] + enemies[i].sprite.size[1] / 2;
            creatBlackEB(x, y, i, 'small');
        }
        big++;
        count = 0;
    }
    if (big == 5) {
        createEnemy(bigenemies, 'big');
        for(var i = 0; i < bigenemies.length; i++) {
            var x = bigenemies[i].pos[0] + bigenemies[i].sprite.size[0] / 2;
            var y = bigenemies[i].pos[1] + bigenemies[i].sprite.size[1] / 2;
            for(var j = 0; j < 8; j++) {
                creatBlackEB(x, y, j, 'big');
            }
        }
        big = 0;
    }

    checkCollisions();
}
function createEnemy(enemy, atom) {
    var randX = Math.random() * 100;
    var spriteMode;
    if(atom == 'big') {
        spriteMode = new Sprite('img/sprite.png',[0,0],[160, 160],3,[0]);
    }
    if(atom == 'small') {
        spriteMode = new Sprite('img/sprite.png',[0, 280],[84, 84],6, [0]);
    }
    if(randX > 0 && randX < 25) {
        creatE(enemy, spriteMode, atom, 'top');
    } else if (randX >= 25 && randX < 50) {
        creatE(enemy, spriteMode, atom, 'bottom');
    } else if (randX >=50 && randX < 75) {
        creatE(enemy, spriteMode, atom, 'right');
    } else {
        creatE(enemy, spriteMode, atom, 'left');
    }
}
function creatE(enemy, spriteM, atom, move) {
    var posMode;
    var x = Math.random() * (canvas.width - 160);
    var y = Math.random() * (canvas.height - 160);
    if(move == 'top') {
        posMode = [x, 0];
    }
    if (move == 'bottom') {
        posMode = [x, canvas.height];
    }
    if (move == 'right') {
        posMode = [canvas.width, y];
    }
    if (move == 'left') {
        posMode = [0, y];
    }
    enemy.push({
        pos: posMode,
        move: move,
        atom: atom,
        sprite: spriteM
    });
}
function creatBlackEB(x, y, i, mode) {
    var spriteMod;
    if(mode=='small'){
        spriteMod = new Sprite('img/sprite.png', [0, 440], [38, 38], 1, [0, 1, 2, 3], null, true);
    }else {
        spriteMod = new Sprite('img/sprite.png', [0, 520], [40, 40], 1, [0, 1, 2, 3], null, true);
    }
    blackbullets.push({ pos: [x, y],
                   dir: blackMove[i],
                   sprite: spriteMod
               });
}
//用户操作绑定
function handleInput(dt) {
    if(input.isDown('DOWN') || input.isDown('s')) {
        player.pos[1] += playerSpeed * dt;
    }

    if(input.isDown('UP') || input.isDown('w')) {
        player.pos[1] -= playerSpeed * dt;
    }

    if(input.isDown('LEFT') || input.isDown('a')) {
        player.pos[0] -= playerSpeed * dt;
    }

    if(input.isDown('RIGHT') || input.isDown('d')) {
        player.pos[0] += playerSpeed * dt;
    }
    if(input.isDown('j')) {
        choiceM = 0;
    }
    if(input.isDown('k')) {
        choiceM = 1;
    }
    if(input.isDown('l')) {
        choiceM = 2;
    }
    if(input.isDown('i')) {
        choiceM = 3;
    }
    if(input.isDown('SPACE') &&
       !isGameOver &&
       Date.now() - lastFire > 300) {
        var x = player.pos[0] + player.sprite.size[0] / 2;
        var y = player.pos[1] + player.sprite.size[1] / 2;
        if(energy == 10) {
            energyCount = 7;
        }
        if(energyCount > 0) {
            for(var i = 0; i < 8; i++) {
                bullets.push({ pos: [x, y],
                               dir: blackMove[i],
                               sprite: new Sprite('img/sprite.png', [0, 480], [40, 40], 1, [0, 1, 2, 3], null, true) });
            }
            player.sprite.pos = [0, 160];
            player.sprite.size = [120, 120];
            player.sprite.frames = [0];
            if(energyCount == 1) {
                energy = 0;
            }
            energyCount--;
        }else {
            bullets.push({ pos: [x, y],
                           dir: bulletMove[choiceM],
                           sprite: new Sprite('img/sprite.png', [0, 560], [34, 34], 1, [0, 1, 2, 3], null, true) });
            player.sprite.pos = [0, 366];
            player.sprite.size = [70, 70];
            player.sprite.frames = [0];
        }
        lastFire = Date.now();
    }
}

//更新各对象
function updateEntities(dt) {
    // master更新
    player.sprite.update(dt);

    // 子弹更新
    bulletUpdate(bullets, dt);
    bulletUpdate(blackbullets, dt);
    //敌人更新
    enemiesMove(enemies, dt);
    enemiesMove(bigenemies, dt);
}
function bulletUpdate(bulletX, dt) {
    for(var i=0; i<bulletX.length; i++) {
        var bullet = bulletX[i];

        switch(bullet.dir) {
        case 'up': bullet.pos[1] -= bulletSpeed * dt; break;
        case 'down': bullet.pos[1] += bulletSpeed * dt; break;
        case 'right': bullet.pos[0] += bulletSpeed * dt; break;
        case 'left': bullet.pos[0] -= bulletSpeed * dt; break;
        case 'up_right': {
            bullet.pos[0] -= bulletSpeed * dt;
            bullet.pos[1] -= bulletSpeed * dt;
            break;
        }
        case 'up_left': {
            bullet.pos[0] += bulletSpeed * dt;
            bullet.pos[1] += bulletSpeed * dt;
            break;
        }
        case 'down_left': {
            bullet.pos[0] += bulletSpeed * dt;
            bullet.pos[1] -= bulletSpeed * dt;
            break;
        }
        case 'down_right': {
            bullet.pos[0] -= bulletSpeed * dt;
            bullet.pos[1] += bulletSpeed * dt;
            break;
        }
        default:
            bullet.pos[0] += bulletSpeed * dt;
        }
        bullet.sprite.update(dt);
        // 判断是否越界
        if(bullet.pos[1] < 0 || bullet.pos[1] > canvas.height ||
           bullet.pos[0] > canvas.width) {
            bulletX.splice(i, 1);
            i--;
        }
    }
}
function enemiesMove(enemy, dt) {
    for(var i=0; i<enemy.length; i++) {
        switch (enemy[i].move) {
            case 'right': {
                enemy[i].pos[0] -= enemySpeed * dt;
                enemy[i].sprite.update(dt);
                break;
            }
            case 'left': {
                enemy[i].pos[0] += enemySpeed * dt;
                enemy[i].sprite.update(dt);
                break;
            }
            case 'top': {
                enemy[i].pos[1] += enemySpeed * dt;
                enemy[i].sprite.update(dt);
                break;
            }
            case 'bottom': {
                enemy[i].pos[1] -= enemySpeed * dt;
                enemy[i].sprite.update(dt);
                break;
            }
            default: {
                break;
            }
        }

        // 越界检测
        if(enemy[i].pos[0] + enemy[i].sprite.size[0] < 0 || 
           enemy[i].pos[1] + enemy[i].sprite.size[1] < 0 /*  || 
           enemy[i].pos[0] + enemy[i].sprite.size[0] > canvas.width || 
           enemy[i].pos[1] + enemy[i].sprite.size[1] > canvas.height*/) {
            enemy.splice(i, 1);
            i--;
        }
    }
}

//碰撞对象检测
function collides(x, y, r, b, x2, y2, r2, b2) {
    return !(r <= x2 || x > r2 ||
             b <= y2 || y > b2);
}
//碰撞检测模型
function boxCollides(pos, size, pos2, size2) {
    return collides(pos[0], pos[1],
                    pos[0] + size[0], pos[1] + size[1],
                    pos2[0], pos2[1],
                    pos2[0] + size2[0], pos2[1] + size2[1]);
}
//检测是否有碰撞（子弹和敌人，master与敌人）
function checkCollisions() {
    checkPlayerBounds();//修正master的位置
    checkExplosions(enemies, bullets);
    //checkExplosions(bigenemies, bullets);
    var pos = player.pos;
    var size = player.sprite.size;
    for(var j = 0; j < blackbullets.length; j++) {
        var pos2 = blackbullets[j].pos;
        var size2 = blackbullets[j].sprite.size;
        if(boxCollides(pos, size, pos2, size2)) {
            gameOver();
        }
    }
}
function checkExplosions(enemy, bullets) {
    for(var i=0; i<enemy.length; i++) {
        var pos = enemy[i].pos;
        var size = enemy[i].sprite.size;

        for(var j=0; j<bullets.length; j++) {
            var pos2 = bullets[j].pos;
            var size2 = bullets[j].sprite.size;

            if(boxCollides(pos, size, pos2, size2)) {
                enemy.splice(i, 1);
                bullets.splice(j, 1);
                i++;
                energy++;
                destroy++;
                score += 10;
                break;
            }
        }
        //master碰撞检测
        if(boxCollides(pos, size, player.pos, player.sprite.size)) {
            gameOver();
        }
    }
}
//修正master的位置
function checkPlayerBounds() {
    if(player.pos[0] < 0) {
        player.pos[0] = 0;
    }
    else if(player.pos[0] > canvas.width - player.sprite.size[0]) {
        player.pos[0] = canvas.width - player.sprite.size[0];
    }

    if(player.pos[1] < 0) {
        player.pos[1] = 0;
    }
    else if(player.pos[1] > canvas.height - player.sprite.size[1]) {
        player.pos[1] = canvas.height - player.sprite.size[1];
    }
}

//对各属性进行绘图操作更新
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = terrainPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    //GG就停止更新动画
    if(!isGameOver) {
        renderEntity(player);
    }

    renderEntities(bullets);
    renderEntities(blackbullets);
    renderEntities(enemies);
    renderEntities(bigenemies);
};
//对敌人和子弹单列更新
function renderEntities(list) {
    for(var i=0; i<list.length; i++) {
        renderEntity(list[i]);
    }    
}
//绘图操作
function renderEntity(entity) {
    ctx.save();
    ctx.translate(entity.pos[0], entity.pos[1]);
    entity.sprite.render(ctx);
    ctx.restore();
}
// GG
function gameOver() {
    gameO.style.display = "block";
    if(destroy != 100) {
        SC.innerHTML = user.nicname+"，才"+score+"分啊，少年！再来一发！";
    } else {
        SC.innerHTML = "强无敌的少年，" + user.nicname + "突出重围";
    }
    user.score = score;
    isGameOver = true;
}

// 重启
function reset() {
    gameO.style.display = "none";
    isGameOver = false;
    gameTime = 0;
    score = 0;
    energy = 0;
    energyCount = 0;
    destroy = 0;
    count = 0;
    big = 0;

    enemies = [];
    bigenemies = [];
    bullets = [];
    blackbullets = [];

    player.pos = [50, canvas.height / 2];
};
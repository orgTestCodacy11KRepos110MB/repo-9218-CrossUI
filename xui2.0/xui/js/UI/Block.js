Class("xui.UI.Block", "xui.UI.Widget",{
    Initialize:function(){
        var self=this,
            t = self.getTemplate();
        //modify
        t.className += ' {_sidebarStatus}';
        xui.merge(t.FRAME.BORDER,{
            className:'xui-uiw-border xui-uibar {clsBorderType1}',
            SIDEBAR:{
                tagName:'div',
                className:'xui-uisb {_sidebar}',
                SBBTN:{
                    className:'xui-uisbbtn xuifont',
                    $fonticon:'{_fi_btn}'
                },
                SBCAP:{
                    className:'xui-uisbcap xui-title-node',
                    text:'{sideBarCaption}'
                }
            },
            PANEL:{
                tagName:'div',
                className:'xui-uibar xui-uicontainer {clsBorderType2}',
                style:'{_panelstyle};{background};{_overflow};',
                text:'{html}'+xui.UI.$childTag
            }
        },'all');
        //set back
        self.setTemplate(t);

        //get default Appearance
        t = self.getAppearance();
        //modify
        xui.merge(t,{
            PANEL:{
                position:'relative',
                overflow:'auto'
            }
        });
        //set back
        self.setAppearance(t);
    },
    Static:{
        Behaviors:{
            DroppableKeys:['PANEL'],
            PanelKeys:['PANEL'],
            PANEL:{
                onClick:function(profile, e, src){
                    var p=profile.properties;
                    if(p.disabled)return false;
                    if(profile.onClickPanel)
                        return profile.boxing().onClickPanel(profile, e, src);
                }
            },
            SBBTN:{
                onClick:function(profile, e, src){
                    var p=profile.properties,
                        a=p.sideBarType,
                        b=p.sideBarStatus;
                    if(p.disabled)return false;
                    profile.boxing().setSideBarStatus(b=='fold'?'expand':'fold');
                    
                    var target= b=='expand'
                        ? a=='left'?'left':a=='right'?'right':a=='top'?'up':'down'
                        : a=='left'?'right':a=='right'?'left':a=='top'?'down':'up';

                    xui.use(src).replaceClass(/(xui-icon-double)[\w]+/g,'$1' + target);
                }
            }
        },
        EventHandlers:{
            onClickPanel:function(profile, e, src){}
        },
        DataModel:{
            //delete those properties
            disabled:null,
            tips:null,
            rotate:null,
            iframeAutoLoad:{
                ini:"",
                action:function(){
                    xui.UI.Div._applyAutoLoad(this);
                }
            },
            ajaxAutoLoad:{
                ini:"",
                action:function(){
                    xui.UI.Div._applyAutoLoad(this);
                }
            },
            selectable:true,
            html:{
                html:1,
                action:function(v,ov,force){
                    this.getSubNode('PANEL').html(xui.adjustRes(v,0,1),null,null,force);
                }
            },
            borderType:{
                ini:'outset',
                listbox:['none','flat','inset','outset','groove','ridge'],
                action:function(v){
                    var ns=this,
                        p=ns.properties,
                        n1=ns.getSubNode('BORDER'), n2=ns.getSubNode('PANEL'),
                        reg=/^xui-uiborder-/,
                        flat='xui-uiborder-flat xui-uiborder-radius',
                        ins='xui-uiborder-inset xui-uiborder-radius',
                        outs='xui-uiborder-outset xui-uiborder-radius',
                        root=ns.getRoot();
                    n1.removeClass(reg);
                    n2.removeClass(reg);
                    switch(v){
                        case 'flat':
                        n1.addClass(flat);
                        break;
                        case 'inset':
                        n1.addClass(ins);
                        break;
                        case 'outset':
                        n1.addClass(outs);
                        break;
                        case 'groove':
                        n1.addClass(ins);
                        n2.addClass(outs);
                        break;
                        case 'ridge':
                        n1.addClass(outs);
                        n2.addClass(ins);
                        break;
                    }

                    //force to resize
                    ns.box._setB(ns);
                    xui.UI.$tryResize(ns,root.get(0).style.width,root.get(0).style.height,true);
                }
            },

            // for side bar
            sideBarType:{
                ini:'none',
                listbox:['none','left','top','right','bottom'],
                action:function(v){
                    var ns=this, 
                        prop=ns.properties,
                        reg=/^xui-uisb-/,
                        node=ns.getSubNode('SIDEBAR');
                    
                    node.removeClass(reg);
                    node.addClass('xui-uisb-'+v);

                    if(prop.dock=='none')
                        xui.UI.$tryResize(ns, prop.width, prop.height,true);
                    else
                        ns.boxing().adjustDock(true);
                }
            },
            sideBarCaption:{
                ini:'',
                action:function(v){
                    this.getSubNode("SBCAP").html(v);
                }
            },
            sideBarStatus:{
                ini:'expand',
                listbox:['expand','fold'],
                action:function(v){
                    var ns=this, 
                        prop=ns.properties;
                    ns.getRoot().tagClass('-fold', v!='expand');

                    // use sync way
                    xui.UI.$doResize(ns, prop.width, prop.height,true);
                    ns.boxing().adjustDock(true);
                }
            },
            sideBarSize:{
                ini:'2em',
                action:function(v){
                    var ns=this, 
                        prop=ns.properties;
                    if(prop.dock=='none')
                        xui.UI.$tryResize(ns, prop.width, prop.height,true);
                    else
                        ns.boxing().adjustDock(true);
                }
            },

            background:{
                format:'color',
                ini:'',
                action:function(v){
                    this.getSubNode('PANEL').css('background',v);
                }
            },
            width:{
                $spaceunit:1,
                ini:'10em'
            },
            height:{
                $spaceunit:1,
                ini:'10em'
            }
        },
        Appearances:{
            KEY:{
                'line-height':'auto'
            },
            'KEY-fold PANEL':{
                display:'none'
            }
        },
        RenderTrigger:function(){
            // only div
            var ns=this;
            if(ns.box.KEY=="xui.UI.Block")
                if(ns.properties.iframeAutoLoad||ns.properties.ajaxAutoLoad)
                    xui.UI.Div._applyAutoLoad(this);
        },
        _setB:function(profile){
            var p=profile.properties,
                type=p.borderType,
                nd=profile.getSubNode("BORDER"),
                w=nd._borderW('left');
            p.$hborder=p.$vborder=p.$iborder=0;

            if(type=='flat'||type=='inset'||type=='outset'){p.$hborder=p.$vborder=w;p.$iborder=0;}
            else if(type=='groove'||type=='ridge'){p.$hborder=p.$vborder=p.$iborder=w;}
        },
        LayoutTrigger:function(){
            var prop=this.properties,
                m=prop.sideBarStatus,
                v=prop.borderType;
            if(v!='none')this.boxing().setBorderType(v,true);
            if(m=='fold')this.boxing().setSideBarStatus('fold',true);
        },
        _prepareData:function(profile){
            var data=arguments.callee.upper.call(this, profile),
                a=data.sideBarType,
                b=data.sideBarStatus;
            data.background= data.background?'background:'+data.background:'';
            if(xui.isStr(data.overflow))
                data._overflow = data.overflow.indexOf(':')!=-1?(data.overflow):(data.overflow?("overflow:"+data.overflow):"");
            
            data._sidebar = 'xui-uisb-' + a;
            data._sidebarStatus = b=='fold'?profile.getClass('KEY','-fold'):'';

            data._fi_btn =  'xui-icon-double' + ( b=='fold'
                ? a=='left'?'left':a=='right'?'right':a=='top'?'up':'down'
                : a=='left'?'right':a=='right'?'left':a=='top'?'down':'up');

            return data;
        },        
        _onresize:function(profile,width,height){
            var size = arguments.callee.upper.apply(this,arguments),
                root=profile.getRoot(),
                border=profile.getSubNode('BORDER'),
                panel=profile.getSubNode('PANEL'),
                sidebar=profile.getSubNode('SIDEBAR'),
                sbcap=profile.getSubNode('SBCAP'),
                prop=profile.properties,
                sbs=prop.sideBarStatus,
                sbtype=prop.sideBarType,
                b=(prop.$iborder||0)*2,
                useem = xui.$uem(prop),
                adjustunit = function(v,emRate){return profile.$forceu(v, useem?'em':'px', emRate)};
                panelfz = useem||profile.$isEm(width)||profile.$isEm(height)?panel._getEmSize():null,
                // caculate by px
                ww=width?profile.$px(size.width):size.width, 
                hh=height?profile.$px(size.height):size.height,
                sbsize=profile.$px(prop.sideBarSize),
                sbsize2=adjustunit(sbsize);

            size.left=size.top=0;
            if(sbtype!='none'){
                sbcap.css('line-height',adjustunit(sbsize - 2));
                if(sbtype=='left'||sbtype=='right'){
                    sidebar.width(sbsize2);
                    if(height&&'auto'!==height)
                        sidebar.height(adjustunit(hh - b));
                }else{
                    sidebar.height(sbsize2);
                    sidebar.width(adjustunit(ww - b));
                }

                if(sbs=='fold'){
                    if(sbtype=='left'||sbtype=='right'){
                        root.width(adjustunit(sbsize+prop.$hborder*2));
                        border.width(sbsize2);
                    }else{
                        root.height(adjustunit(sbsize+prop.$hborder*2));
                        border.height(sbsize2);
                    }
                    return;
                }else{
                    switch(sbtype){
                        case 'left':
                            ww-=sbsize;
                            size.left=sbsize;
                            break;
                        case 'right':
                            ww-=sbsize;
                            break;
                        case 'top':
                            hh-=sbsize;
                            size.top=sbsize;
                            break;
                        case 'bottom':
                            hh-=sbsize;
                            break;
                    }
                }
            }
            if(size.width) size.width = adjustunit(ww -b, panelfz);
            if(size.height&&'auto'!==size.height)
                size.height = adjustunit(hh - b, panelfz);
            panel.cssRegion(size,true);
        }
    }
});


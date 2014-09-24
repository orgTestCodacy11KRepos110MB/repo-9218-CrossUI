Class("xui.UI.TreeBar",["xui.UI","xui.absList","xui.absValue"],{
    Instance:{
        _setCtrlValue:function(value, flag){
            return this.each(function(profile){
                if(!profile.renderId)return;

                var box = profile.boxing(),
                    uiv = box.getUIValue(),
                    properties = profile.properties,
                    fun=function(key,o,b){
                        profile.getSubNodeByItemId(key, o).tagClass('-checked', b);
                    },
                    selmode=properties.selMode
                    ;
                if(selmode=='single'){
                    var itemId = profile.getSubIdByItemId(uiv);
                    if(uiv && itemId)
                        profile.getSubNode('BAR',itemId).tagClass('-checked',false);

                    itemId = profile.getSubIdByItemId(value);
                    if(itemId){
                        profile.getSubNode('BAR',itemId).tagClass('-checked');
                        //scroll
                        if(!profile._innerSet){
                            var o = profile.getSubNode('ITEM',itemId);
                            if(o){
                                var items = profile.getSubNode('BOX'),
                                    offset = o.offset(null, items),
                                    top = offset?offset.top:0,
                                    height = o.offsetHeight(),
                                    sh=items.scrollHeight(),
                                    st=items.scrollTop(),
                                    hh=items.height();
                                if(sh > hh)
                                    if(top<st || (top+height)>(st+hh))
                                        items.scrollTop(top);
                            }
                        }
                    }
                }else if(selmode=='multi'||selmode=='multibycheckbox'){
                    uiv = uiv?uiv.split(properties.valueSeparator):[];
                    value = value?value.split(properties.valueSeparator):[];
                    if(flag){
                        _.arr.each(value,function(o){
                            fun('BAR', o);
                        });
                    }else{
                        //check all
                        _.arr.each(uiv,function(o){
                            fun('BAR', o, false);
                        });
                        _.arr.each(value,function(o){
                            fun('BAR', o);
                        });
                    }
                }
            });
        },
        insertItems:function(arr, pid, base ,before){
            if(!arr || !_.isArr(arr) || arr.length<1)return this;
            var node,data,
                b=this._afterInsertItems;

            return this.each(function(profile){
                // prepare properties format
                var tar,r,k;

                data=profile.box._adjustItems(arr);

                if(!pid){
                    k=profile.properties;
                    tar = k.items ||(k.items=[])
                }else{
                    k=profile.getItemByItemId(pid);
                    tar = _.isArr(k.sub)?k.sub:(k.sub= []);
                }
                //1
                if(profile.renderId){
                    if(!base){
                        if(!pid)
                            node=profile.getSubNode('ITEMS');
                        else if(pid && k._inited)
                            node=profile.getSubNodeByItemId('SUB', pid);
                        if(node){
                            r=profile._buildItems('items', profile.box._prepareItems(profile, data, pid));
                            if(before)
                                node.prepend(r);
                            else
                                node.append(r);
                        }
                    }else{
                        node=profile.getSubNodeByItemId('ITEM', base);
                        if(node){
                            r=profile._buildItems('items', profile.box._prepareItems(profile, data, pid));
                            if(before)
                                node.addPrev(r);
                            else
                                node.addNext(r);
                        }
                    }
                }
                //2
                //must be here
                if(!base)
                    _.arr.insertAny(tar,data, before?0:-1);
                else{
                    var index = _.arr.subIndexOf(tar, 'id', base);
                    _.arr.insertAny(tar,data, before?index:(index+1));
                }
                //3
                if(profile.renderId){
                    // try to open root subs
                    if(!pid){
                            profile.boxing()._toggleNodes(data, true, true, true);
                    }
                    // try to open parent node
                    else if (profile.getItemByItemId(pid)._inited){
                        if(!(('iniFold' in k)?k.iniFold:profile.properties.iniFold))
                                profile.boxing()._toggleNodes(data, true, true, true);
                    }
                }
                
                if(b && profile.renderId)
                    profile.boxing()._afterInsertItems(profile, data, pid, base, before);

                if(profile.renderId && pid){
                    profile.box._tofold(profile,k,pid);
                }

            });
        },
        _toggleNodes:function(items, expand, recursive, init){
            var self=this,prf=self.get(0),pro=prf.properties,
                f=function(items){
                    if(_.isArr(items)){
                        _.arr.each(items,function(o){
                            
                            if(init && (_.isBool(o.iniFold)?o.iniFold:pro.iniFold))return;
                            
                            self.toggleNode(o.id, expand, false);
                            if(recursive && o.sub && _.isArr(o.sub) && o.sub.length){
                                f(o.sub);
                            }
                        });
                    }
                };
            f(items);
            return self;
        },
        /*
        *expand:true->expand false->fold
        *recursive:true open recursively
        */
        toggleNode:function(id, expand, recursive){
            var profile=this.get(0),ns=this,self=arguments.callee;
            if(id){
                var o=profile.getItemByItemId(id);
                if(o && o.sub)
                    profile.box._setSub(profile, o, typeof expand=="boolean"?expand:!o._checked, recursive);
            }else{
                _.arr.each(profile.properties.items,function(item){
                    self.call(ns,item.id,expand,recursive);
                })
            }
            return this;
        },
        /*
        *open to deep node
        */
        openToNode:function(id){
            return this.each(function(profile){
                var res=false, a=[],
                    fun=function(arr, catId, layer){
                        layer = layer || 0;
                        var me=arguments.callee;
                        _.arr.each(arr,function(o){
                            if(o.id==catId){
                                a.push(o);
                                res=true;
                                return false;
                            }
                            if(o.sub && _.isArr(o.sub)){
                                res = me.call(me, o.sub, catId, ++layer)
                                if(res){
                                    a.push(o);
                                    return false;
                                }
                            }
                        });
                        return res;
                    }
                fun(profile.properties.items, id);
                if(res){
                    a.reverse();
                    _.arr.each(a,function(o,i){
                        if(o.sub){
                            profile.boxing().toggleNode(o.id,true);
                            // for the last one, trigger its onclick event
                            if(i==a.length-1 && !(o.hasOwnProperty('group')?o.group:profile.properties.group))
                                profile.boxing().fireItemClickEvent(o.id);
                        }else
                            profile.boxing().fireItemClickEvent(o.id);
                    });
                }
            });
        }
    },
    Initialize:function(){
        this.addTemplateKeys(['DISABLED']);
    },
    Static:{
        _focusNodeKey:'BAR',
        Templates:{
            tagName : 'div',
            style:'{_style}',
            className:'{_className}',
            ondrag:'return false',
            onselectstart:'return false',
            BORDER:{
                tagName : 'div',
                BOX:{
                    tagName : 'div',
                    onselectstart:'return false',
                    ITEMS:{
                        tagName : 'div',
                        text:"{items}"
                    }
                }
            },
            $submap:{
                items:{
                    ITEM:{
                        className:'{itemClass}',
                        style:'{itemStyle}{itemDisplay}',
                        tagName : 'div',
                        BAR:{
                            $order:0,
                            tabindex: '{_tabindex}',
                            className:'{cls_group} {cls_fold} {disabled} {readonly}',
                            RULER:{
                                $order:0,
                                style:'{rulerStyle}',
                                text:'{innerIcons}'
                            },
                            TOGGLE:{
                                $order:1,
                                className:'{togglemark}'
                            },
                            MARK:{
                                $order:2,
                                style:'{mark2Display}'
                            },
                            ITEMICON:{
                                $order:3,
                                className:'xui-ui-icon {imageClass}',
                                style:'{backgroundImage} {backgroundPosition} {backgroundRepeat} {imageDisplay}'
                            },
                            ITEMCAPTION:{
                                text : '&nbsp;{caption}',
                                className:"{disabled}  {readonly}",
                                $order:4
                            },
                            EXTRA:{
                                text : '{ext}',
                                $order:5
                            },
                            OPT:{
                                $order:6
                            }
                        },
                        SUB:{
                            $order:1,
                            tagName : 'div',
                            text:xui.UI.$childTag
                        }
                    }
                }
            }
        },
        Appearances:{
            KEY: {
                'font-family': 'Verdana, Helvetica, sans-serif',
                'border':0
            },
            EXTRA:{
                display:'none'
            },
            BOX:{
                left:0,
                overflow: 'auto',
                'overflow-x': 'hidden',
                position:'relative'
            },
            ITEMS:{
                overflow: 'hidden'
            },
            ITEM:{
                'white-space': 'nowrap',
                position:'relative',
                overflow:'hidden'
            },
            BAR:{
               cursor:'pointer',
               zoom:xui.browser.ie?1:null,
               position:'relative',
               display:'block',
               overflow: 'hidden',
               'font-size':'12px',
               padding:'2px 4px',
               border: '1px solid',
               'outline-offset':'-1px',
               '-moz-outline-offset':(xui.browser.gek && xui.browser.ver<3)?'-1px !important':null,
               'border-color':'#EDF4FC #698AB3 #698AB3 #EDF4FC',
               'background-color':'#CCE4FC'
            },
            DISABLED:{
                color:'#808080'
            },
            'BAR-mouseover':{
                $order:1,
               'background-color': '#fffa9f'
            },
            'BAR-checked':{
                $order:2,
               'background-color': '#fffa9f'
            },
            'BAR-GROUP':{
                $order:2,
                'border-top': 'none',
                'border-bottom': 'none',
                padding:'5px 4px',
                height:'18px',
                'background-image': xui.UI.$bg('bar_vertical.gif','', true),
                'background-repeat':'repeat-x',
                'background-position':'left -380px'
            },
            'BAR-GROUP-mouseover':{
                $order:3,
                'background-position': 'left -410px'
            },
            'BAR-GROUP-expand':{
                $order:4,
                'background-position': 'left -440px'
            },
            SUB:{
                overflow:'hidden',
                zoom:xui.browser.ie?1:null,
                height:0,
                'font-size':'1px',
                //1px for ie8
                'line-height':'1px',
                position:'relative',
                'margin-left':'16px'
            },

            MARK:{
               cursor:'pointer',
               width:'16px',
               height:'16px',
               'vertical-align':'middle',
               'background-image': xui.UI.$bg('icons.gif','', true),
               'background-repeat':'no-repeat',
               'background-position':'-20px -70px'
            },
            'BAR-checked MARK':{
                $order:3,
                'background-position': '0 -70px'
            },
            ITEMCAPTION:{
                'vertical-align':xui.browser.ie6?'baseline':'middle',
                padding:'2px'
            },
            OPT:{
                $order:1,
                position:'absolute',
                left:'auto',
                top:'auto',
                right:'2px',
                top:'2px',
                width:'16px',
                height:'16px',
                display:'none',
                'background-image': xui.UI.$bg('icons.gif','', true),
               'background-repeat':'no-repeat',
               'background-position':'-130px -224px'
            },
            'OPT-mouseover':{
                $order:2,
                'background-position':'-130px -244px'
            },
            'OPT-mousedown':{
                $order:3,
                'background-position':'-130px -264px'
            }
        },
        Behaviors:{
            HoverEffected:{TOGGLE:'TOGGLE', BAR:'BAR',OPT:'OPT'},
            ClickEffected:{TOGGLE:'TOGGLE', BAR:'BAR',OPT:'OPT'},
            DraggableKeys:["BAR"],
            NoDraggableKeys:['TOGGLE'],
            DroppableKeys:["BAR","TOGGLE","BOX"],
            onSize:xui.UI.$onSize,
            TOGGLE:{
                onClick:function(profile, e, src){
                    var properties = profile.properties,
                        domId=xui.use(src).id(),
                        item = profile.getItemByDom(domId);

                    if(properties.disabled || item.disabled)return false;
                    if(!('sub' in item))return false;
                    profile.box._setSub(profile, item, !item._checked);

                    // not to fire BAR's onclick event;
                    return false;
                }
            },
            BAR:{
                onDblclick:function(profile, e, src){
                    var properties = profile.properties,
                        item = profile.getItemByDom(src),
                        rtn=profile.onDblclick && profile.boxing().onDblclick(profile, item, e, src);
                    if(item.sub && rtn!==false){
                        profile.getSubNode('TOGGLE',profile.getSubId(src)).onClick();
                    }
                },
                onClick:function(profile, e, src){
                    return profile.box._onclickbar(profile,e,src);
                },
                onKeydown:function(profile, e, src){
                    return profile.box._onkeydownbar(profile,e,src);
                },
                onContextmenu:function(profile, e, src){
                    if(profile.onContextmenu)
                        return profile.boxing().onContextmenu(profile, e, src, profile.getItemByDom(src) )!==false;
                },
                onMouseover:function(profile, e, src){
                    if(!profile.properties.optBtn)return;
                    profile.getSubNode('OPT',profile.getSubId(src)).setInlineBlock();
                },
                onMouseout:function(profile, e, src){
                    if(!profile.properties.optBtn)return;
                    profile.getSubNode('OPT',profile.getSubId(src)).css('display','none');
                }
            },
            OPT:{
                onClick:function(profile, e, src){
                    if(!profile.properties.optBtn)return;
                    if(profile.onShowOptions){
                        var item = profile.getItemByDom(src);
                        profile.boxing().onShowOptions(profile, item, e, src);
                    }
                    return false;
                },
                onDblclick:function(profile, e, src){
                    return false;
                }
            },
            BOX:{
                onScroll:function(profile, e, src){
                    //for ie 'href focus' will scroll view
                    if((e=xui.use(src)).scrollLeft()!==0)
                        e.scrollLeft(0);
                }
            }
        },
        EventHandlers:{
            onDblclick:function(profile, item, e, src){},
            onGetContent:function(profile, item, callback){},

            onShowOptions:function(profile, item, e, src){},
            onClick:function(profile, item, e, src){},
            beforeClick:function(profile, item, e, src){},
            afterClick:function(profile, item, e, src){},
            
            onItemSelected:function(profile, item, e, src, type){},
            beforeFold:function(profile,item){},
            beforeExpand:function(profile,item){},
            afterFold:function(profile,item){},
            afterExpand:function(profile,item){}
        },
        DataModel:{
            listKey:null,
            width:200,
            height:200,
            iniFold:true,
            animCollapse:false,
            dock:'fill',
            group:{
                ini:false,
                action:function(v){
                    var self = this,
                        items = self.properties.items,
                        results = self.queryItems(items, function(o){return o.sub && o.group===undefined }),
                        nodes=xui();
                    _.arr.each(results,function(o){
                        nodes.merge( self.getSubNodeByItemId('BAR', o.id) );
                    });
                    var cls1=self.getClass('BAR'), cls2 = self.getClass('BAR', '-group');
                    if(v)
                       nodes.replaceClass(new RegExp('(\\b)' + cls1 + '([^b]*\\b)','g'), '$1'+cls2+'$2');
                    else
                       nodes.replaceClass(new RegExp('(\\b)' + cls2 + '([^b]*\\b)','g'), '$1'+cls1+'$2');
                }
            },
            selMode:{
                ini:'single',
                listbox:['single','none','multi','multibycheckbox'],
                action:function(value){
                    var ns=this,p=this.properties,sels=[];
                    _.each(this.SubSerialIdMapItem,function(o){
                        if(!(o.sub && (o.hasOwnProperty('group')?o.group:p.group)))
                            sels.push(ns.getSubNodeByItemId('MARK',o.id).get(0));
                    });
                    xui(sels).css('display',(value=='multi'||value=='multibycheckbox')?'':'none');
                }
            },
            noCtrlKey:true,
            singleOpen:false,
            dynDestory:false,
            position:'absolute',
            optBtn:false
        },
        RenderTrigger:function(){
            this.boxing()._toggleNodes(this.properties.items, true, true, true);
        },
        _onclickbar:function(profile, e, src){
            var properties = profile.properties,
                domId=xui.use(src).id(),
                item = profile.getItemByDom(domId),
                itemId =profile.getSubId(domId),
                box = profile.boxing(),
                ks = xui.Event.getKey(e),
                sk = profile.getKey(xui.Event.getSrc(e).id||""),
                ignoreClick = sk==profile.keys.TOGGLE||sk==profile.keys.MARK;

            if(!ignoreClick && profile.beforeClick && false===o.boxing().beforeClick(profile,item,e,src))return false;
                
            if(properties.disabled|| item.disabled)return false;

            if(!ignoreClick && profile.onClick)
                box.onClick(profile,item,e,src);

            //group not fire event
            if(item.sub && (item.hasOwnProperty('group')?item.group:properties.group)){
                profile.getSubNode('TOGGLE', itemId).onClick();
                return;
            }
    
            profile.getSubNode(profile.box._focusNodeKey, itemId).focus();
    
            switch(properties.selMode){
            case 'none':
                box.onItemSelected(profile, item, e, src, 0);
                break;
            case 'multibycheckbox':
                if(properties.readonly|| item.readonly)return false;
                if(profile.keys.MARK){
                    if(sk!=profile.keys.MARK){
                        box.onItemSelected(profile, item, e, src, 0);
                        break;
                    }
                }
            case 'multi':
                if(properties.readonly|| item.readonly)return false;
                var value = box.getUIValue(),
                    arr = value?value.split(properties.valueSeparator):[],
                    checktype=1;
                if(arr.length&&(ks.ctrlKey||ks.shiftKey||properties.noCtrlKey)){
                    if(ks.shiftKey){
                        if(profile.$firstV._pid!=item._pid)return;
                        var items=properties.items;
                        if(item._pid){
                            var pitem=profile.getItemByItemId(item._pid);
                            if(pitem)items=pitem.sub;
                        }
                        var i1=_.arr.subIndexOf(items,'id',profile.$firstV.id),
                            i2=_.arr.subIndexOf(items,'id',item.id),
                            i;
                        arr.length=0;
                        for(i=Math.min(i1,i2);i<=Math.max(i1,i2);i++)
                            arr.push(items[i].id);
                    }else{
                        if(_.arr.indexOf(arr,item.id)!=-1){
                            _.arr.removeValue(arr,item.id);
                            checktype=-1;
                        }else
                            arr.push(item.id);
                    }
                    arr.sort();
                    value = arr.join(properties.valueSeparator);
    
                    //update string value only for _setCtrlValue
                    if(box.getUIValue() != value){
                        profile._innerSet=1;
                        box.setUIValue(value);
                        delete profile._innerSet;
                        if(box.get(0) && box.getUIValue() == value)
                            box.onItemSelected(profile, item, e, src, checktype);
                    }
                    break;
                }
            case 'single':
                if(box.getUIValue() != item.id){
                    profile.$firstV=item;
                    profile._innerSet=1;
                    box.setUIValue(item.id);
                    delete profile._innerSet;
                    if(box.get(0) && box.getUIValue() == item.id)
                        box.onItemSelected(profile, item, e, src, 1);
                }
                break;
            }
            if(!ignoreClick && profile.afterClick)box.afterClick(profile,item,e,src);
        },
        _onkeydownbar:function(profile, e, src){
            var keys=xui.Event.getKey(e), key = keys.key, shift=keys.shiftKey, ctrl=keys.ctrlKey,
                cur = profile.getSubNode(profile.box._focusNodeKey, profile.getSubId(src)),
                root = profile.getRoot(),
                first = root.nextFocus(true, true, false),
                last = root.nextFocus(false, true, false);

            switch(key){
                case 'enter':
                    cur.onClick();
                    break;
                case 'tab':
                    if(shift){
                        if(cur.get(0)!=first.get(0)){
                            first.focus();
                            return false;
                        }
                    }else{
                        if(cur.get(0)!=last.get(0)){
                            last.focus();
                            return false;
                        }
                    }
                    break;
                case 'up':
                    if(ctrl){
                        profile.getSubNode('TOGGLE',profile.getSubId(src)).onClick();
                        return false;
                    }
                    if(cur.get(0)==first.get(0))
                        last.focus();
                    else
                        cur.nextFocus(false, true, false).focus();
                     return false;
                     break;
                case 'down':
                    if(ctrl){
                        profile.getSubNode('TOGGLE',profile.getSubId(src)).onClick();
                        return false;
                    }
                     if(cur.get(0)==last.get(0))
                        first.focus();
                     else
                        cur.nextFocus(true, false, false).focus();
                     return false;
                     break;
                case 'right':
                case 'left':
                    profile.getSubNode('TOGGLE',profile.getSubId(src)).onClick();
                    return false;
            }
        },
        _onStartDrag:function(profile, e, src, pos){
            var pos=xui.Event.getPos(e);
            xui.use(src).startDrag(e, {
                dragType:'icon',
                shadowFrom:src,
                targetLeft:pos.left+12,
                targetTop:pos.top+12,
                dragCursor:'pointer',
                dragDefer:1,
                dragKey: profile.box.getDragKey(profile, src),
                dragData: profile.box.getDragData(profile, e, src)
            });
            return false;
        },
        _onDropTest:function(profile, e, src, key, data, item){
            var fid=data&&data.domId;
            if(fid){
                var tid=xui.use(src).id();
                if(fid==tid)return false;

                if(_.get(xui.use(src).get(0),['parentNode','previousSibling','firstChild','id'])==fid)return false;

                var oitem=profile.getItemByDom(fid);

                // stop self
                if(item && oitem._pid==item.id)return false;

                var p=xui.use(src).get(0),
                    rn=profile.getRootNode();
                // stop children
                while((p=p.parentNode)){
                    if(profile.getSubId(p.id) == profile.getSubId(fid)){
                        return false;
                    }
                    if(p.id==_.get(rn,["parentNode","id"])){
                        break;
                    }
                }
            }
        },
        _onDrop:function(profile, e, src, key, data, item){
            xui.DragDrop.setDragIcon('none');

            var k=profile.getKey(xui.use(src).id()),
                po=data.profile,
                ps=data.domId,
                oitem,
                ks=profile.keys,
                t=xui.absObj.$specialChars,
                b=profile.boxing();
            //remove
            oitem=_.clone(po.getItemByDom(ps),function(o,i){return !t[(i+'').charAt(0)]});
            po.boxing().removeItems([oitem.id]);

            //add
            if(k==ks.BOX)
                b.insertItems([oitem], null, null, false);
            else if(k==ks.BAR)
                b.insertItems([oitem], item._pid, item.id, true);
            else if(k==ks.TOGGLE)
                b.insertItems([oitem], item.id, null, false);

            return false;
        },
        _prepareItem:function(profile, item, oitem, pid, index,len){
            var p=profile.properties,
                map1=profile.ItemIdMapSubSerialId,
                map2=profile.SubSerialIdMapItem,
                pitem;

            if(pid)
                oitem._pid=pid;

            // set 'visible' will show when parent call .height()
            item.togglemark = item.sub?'xui-uicmd-toggle':'xui-uicmd-none';

            item.disabled = item.disabled?profile.getClass('KEY', '-disabled'):'';
            item.itemDisplay=item.hidden?'display:none;':'';
            item.mark2Display = (p.selMode=='multi'||p.selMode=='multibycheckbox')?'':'display:none;';
            item._tabindex = p.tabindex;
            //change css class
            if(item.sub && (item.hasOwnProperty('group')?item.group:p.group)){
                item.cls_group = profile.getClass('BAR', '-group');
                item.mark2Display = 'display:none';
            }
        },
        _setSub:function(profile, item, flag, recursive){
            var id=profile.domId,
                ins=profile.boxing(),
                itemId = profile.getSubIdByItemId(item.id),
                properties = profile.properties,
                barNode = profile.getSubNode('BAR', itemId),
                markNode = profile.getSubNode('TOGGLE', itemId),
                subNs = profile.getSubNode('SUB', itemId);
                ;

            if(xui.Thread.isAlive(profile.key+profile.id)) return;
            //close
            if(!flag){
                if(item._checked){
                    if(ins.beforeFold && false===ins.beforeFold(profile,item)){
                        return;
                    }
                    var h=subNs.height();

                    if(properties.animCollapse)
                        subNs.animate({'height':[h,0]},null,function(){
                            subNs.css({display:'none'})
                        }, 200, 0, 'expoIn', profile.key+profile.id).start();
                    else
                        subNs.css({
                            display:'none',
                            height:0
                        });

                    markNode.tagClass('-checked', false);
                    barNode.tagClass('-expand',false).tagClass('-fold');
                    item._checked = false;

                    if(properties.dynDestory){
                        var s=item.sub, arr=[];
                        for(var i=0,l=s.length;i<l;i++)
                            arr.push(s[i].id);
                        profile.boxing().removeItems(arr);
                        item.sub=true;
                        delete item._inited;
                    }
                    if(ins.afterFold)
                        ins.afterFold(profile,item);
                }

                if(recursive && item.sub && !properties.dynDestory){
                    _.arr.each(item.sub,function(o){
                        if(o.sub && o.sub.length)
                            profile.box._setSub(profile, o, flag, recursive);
                    });
                }
            }else{
                //open
                if(!item._checked){
                    if(ins.beforeExpand && false===ins.beforeExpand(profile,item)){
                        return;
                    }

                    var openSub = function(profile, item, id, markNode, subNs, barNode, sub, recursive){
                            var b=profile.boxing(),
                                p=profile.properties;
                            //created
                            if(!item._inited){
                                delete item.sub;
                                //before insertRows
                                item._inited=true;
                                //subNs.css('display','none');
                                if(typeof sub=='string')
                                    subNs.html(item.sub=sub,false);
                                else if(_.isArr(sub)){
                                    b.insertItems(sub, item.id);
                                    // for []
                                    if(!item.sub)item.sub=sub;                                    
                                }else if(sub['xui.Template']||sub['xui.UI']){
                                    subNs.append(item.sub=sub.render(true));
                                }

                                //set checked items
                                profile._innerSet=1;
                                b.setUIValue(b.getUIValue(), true);
                                delete profile._innerSet;
                            }

                            if(p.singleOpen)
                                b._toggleNodes(item._pid?profile.getItemByItemId(item._pid).sub:p.items, false)

                            if(!recursive){
                                var h = subNs.height(true);
                                if(p.animCollapse)
                                    subNs.animate({'height':[0,h]},function(){
                                            subNs.css({display:''})
                                        },function(){
                                            subNs.css({height:'auto'})
                                        },200, 0, 'expoOut', profile.key+profile.id).start();
                                else
                                    subNs.css({display:'',height:'auto'});
                            }else
                                subNs.css({display:'',height:'auto'});

                            markNode.tagClass('-checked');
                            barNode.tagClass('-fold',false).tagClass('-expand');

                            item._checked = true;
                        },
                        sub=item.sub,
                        callback=function(sub){
                            openSub(profile, item, id, markNode, subNs, barNode, sub, recursive)
                        },
                        t;
                    if((t=typeof sub)=='string'||t=='object')
                        callback(sub);
                    else if(profile.onGetContent){
                        var r=profile.boxing().onGetContent(profile, item, callback);
                        if(r){
                            //return true: continue UI changing
                            if(r===true)
                                item._inited=true;
                            callback(r);
                        }                                                              }
                    if(ins.afterExpand)
                        ins.afterExpand(profile,item);
                }
                if(recursive && item.sub){
                    _.arr.each(item.sub,function(o){
                        if(o.sub && o.sub.length && !o._checked)
                            profile.box._setSub(profile, o, flag, recursive);
                    });
                }
            }
        },
        _tofold:function(profile,item,pid){
            profile.getSubNodeByItemId('BAR', pid).addClass(profile.getClass('BAR','-fold'));
            profile.getSubNodeByItemId('TOGGLE', pid).replaceClass(new RegExp("\\buicmd-none\\b"), "xui-uicmd-toggle");
        },
        _onresize:function(profile,width,height){
            profile.getSubNode('BORDER').cssSize({ width :width?width:null, height :height?height:null});
            profile.getSubNode('BOX').cssSize({ width :width?width:null, height : height?height:null});
        }
    }
});
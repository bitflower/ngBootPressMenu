/*jshint camelcase: false */

(function() {

    'use strict';

    var app = angular.module('bootPressMenu', []);

    function treeify(list, idAttr, parentAttr, childrenAttr) {
        if (!idAttr) {
            idAttr = 'id';
        }

        if (!parentAttr) {
            parentAttr = 'parent';
        }
        if (!childrenAttr) {
            childrenAttr = 'children';
        }

        var treeList = [];
        var lookup = {};
        list.forEach(function(obj) {
            lookup[obj[idAttr]] = obj;
            obj[childrenAttr] = [];
        });
        list.forEach(function(obj) {
            if (obj[parentAttr] !== null && obj[parentAttr] !== 0) {
                lookup[obj[parentAttr]][childrenAttr].push(obj);
            } else {
                treeList.push(obj);
            }
        });
        return treeList;
    }

    /**
     * @ngdoc directive
     * @name net.bitflower.ngB3restWordpressBootstrapNavbar
     * @description
     * # ngB3restWordpressBootstrapNavbar
     */
    app.directive('bootPressMenu', [function() {
        return {
            restrict: 'AE',
            scope: {
                brand: '=',
                menuname: '=',
                affixed: '=',
                search: '=',
                searchfn: '&',
                navfn: '&',
                inverse: '=',

            },
            // template: '<nav class="navbar" ng-class="{\'navbar-inverse\': inverse,\'navbar-default\': !inverse,\'navbar-fixed-top\': affixed == \'top\',\'navbar-fixed-bottom\': affixed == \'bottom\'}" role="navigation"><div class="container-fluid"><div class="navbar-header"><button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#navbar-menu"><span class="sr-only">Toggle Navigation</span><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span></button><a class="navbar-brand" ng-click="noop()" ng-bind-html="haveBranding()"></a></div><div class="collapse navbar-collapse" id="navbar-menu"><ul class="nav navbar-nav" ng-if="hasMenus()"><li ng-repeat="menu in menus" ng-class="{true: \'dropdown\'}[hasDropdownMenu(menu)]"><a ng-if="!hasDropdownMenu(menu)" ng-click="navAction(menu.action)" ng-href="{{menu.link}}">{{menu.title}}</a><a ng-if="hasDropdownMenu(menu)" class="dropdown-toggle" data-toggle="dropdown">{{menu.title}} <b class="caret"></b></a><ul ng-if="hasDropdownMenu(menu)" class="dropdown-menu"><li ng-repeat="item in menu.menu" ng-class="{true: \'divider\'}[isDivider(item)]"><a ng-if="!isDivider(item)" ng-click="navAction(item.action)">{{item.title}}</a></li></ul></li></ul><form ng-if="search.show" class="navbar-form navbar-right" role="search"><div class="form-group"><input type="text" class="form-control" placeholder="Search" ng-model="search.terms"><button class="btn btn-default" type="button" ng-click="searchfn()"><span class="glyphicon glyphicon-search"></span></button></div></form></div></div></nav>',
            //template: '<ul class="nav nav-pills" ng-if="menus.length>0"><li ng-repeat="menu in menus" ng-class="{true: \'dropdown\'}[hasDropdownMenu(menu)]"><a ng-if="!hasDropdownMenu(menu)" ng-href="{{menu.link}}">{{menu.title}}</a><a ng-if="hasDropdownMenu(menu)" class="dropdown-toggle" data-toggle="dropdown">{{menu.title}} <b class="caret"></b></a><ul ng-if="hasDropdownMenu(menu)" class="dropdown-menu"><li ng-repeat="item in menu.menu" ng-class="{true: \'divider\'}[isDivider(item)]"><a ng-if="!isDivider(item)" ng-click="navAction(item.action)">{{item.title}}</a></li></ul></li></ul>',
            template: '<div>' +
                '<ul class="nav nav-pills" ng-if="menus.length>0">' +
                ' <li ng-repeat="menu in ::menus" ng-class="[styles.classes.liclass, {true: \'dropdown\'}[hasDropdownMenu(menu)] ]">' +
                '  <a ng-if="!hasDropdownMenu(menu)" ng-href="{{menu.link}}" ng-click="activate({{menu.objectId}})" ng-class="{\'active\': space.activeId=={{menu.objectId}} }">{{::menu.title}}</a>' +
                '  <a ng-if="hasDropdownMenu(menu)" class="dropdown-toggle" data-toggle="dropdown" ng-class="{\'active\': space.activeParentId=={{menu.ID}} }">{{menu.title}} <b class="caret"></b></a>' +
                '  <ul ng-if="hasDropdownMenu(menu)" class="dropdown-menu">' +
                '   <li ng-repeat="item in ::menu.menu" ng-class="{true: \'divider\'}[isDivider(item)]">' +
                '    <a ng-if="!isDivider(item)" ng-click="activate({{item.objectId}}, {{item.parent}})" ng-href="{{item.link}}" ng-class="{\'active\': space.activeId=={{item.objectId}}}">{{::item.title}}</a>' +
                '   </li>' +
                '  </ul>' +
                ' </li>' +
                '</ul>' +
                '</div>',
            replace: true,
            controller: function($scope, $element, $attrs, WPB3Menu, myApp, $timeout) {

                window.MENU_SCOPE = $scope;

                //=== Scope/Attributes Defaults ===//
                $scope.space = {};
                $scope.defaults = {
                    brand: '<span class="glyphicon glyphicon-certificate"></span>',
                    menus: [],
                    search: {
                        show: false
                    },
                    menuname: 'myWordpressMenu'
                }; // end defaults

                // if no parent function was passed to directive for navfn, then create one to emit an event
                if (angular.isUndefined($attrs.navfn)) {
                    $scope.navfn = function(action) {
                        if (angular.isObject(action)) {
                            $scope.$emit('nav.menu', action);
                        } else {
                            $scope.$emit('nav.menu', {
                                'action': action
                            });
                        }
                    }; // end navfn
                }

                // if no parent function was passed to directive for searchfn, then create one to emit a search event
                if (angular.isUndefined($attrs.searchfn)) {
                    $scope.searchfn = function() {
                        $scope.$emit('nav.search.execute');
                    }; // end searchfn
                }

                if (angular.isUndefined($attrs.menuname)) {
                    $scope.menuname = $scope.defaults.menuname;
                } else {
                    $scope.menuname = $attrs.menuname;
                }

                // Set empty array as default
                $scope.menus = $scope.defaults.menus;

                // Get active ID
                $scope.space.delayActivate = angular.isUndefined($attrs.delayActivate) ? 0 : $attrs.delayActivate;
                $scope.$watch(function() {
                    return myApp.activeId();
                }, function() {
                    $timeout(function() {
                        $scope.space.activeId = myApp.activeId();
                        // Parent
                        if ($scope.space.activeId === -1 || !$scope.menusFlat) {
                            return;
                        }
                        var item = $scope.menusFlat.filter(function(item) {
                            return item.objectId === $scope.space.activeId;
                        })[0];
                        if (item) {
                            $scope.space.activeParentId = item.parent;
                        }
                    }, $scope.space.delayActivate);

                });
                // Set active ID
                $scope.activate = function(index, parentIndex) {
                    myApp.activate(index);
                    $scope.space.activeId = index;
                    // Parent
                    $scope.space.activeParentId = parentIndex;

                    // Event ausgeben
                    $scope.$emit('bfwpnavbar::active', { id: index, parent: parentIndex });
                };


                // Styles
                $scope.styles = {
                    classes: {}
                };
                $scope.styles.classes.liclass = $attrs.liclass;

                //=== Observers & Listeners ===//

                $scope.$watch('affixed', function(val, old) {
                    old = '';
                    var b = angular.element('body');
                    // affixed top
                    if (angular.equals(val, 'top') && !b.hasClass('navbar-affixed-top')) {
                        if (b.hasClass('navbar-affixed-bottom')) {
                            b.removeClass('navbar-affixed-bottom');
                        }
                        b.addClass('navbar-affixed-top');
                        //affixed bottom
                    } else if (angular.equals(val, 'bottom') && !b.hasClass('navbar-affixed-bottom')) {
                        if (b.hasClass('navbar-affixed-top')) {
                            b.removeClass('navbar-affixed-top');
                        }
                        b.addClass('navbar-affixed-bottom');
                        // not affixed
                    } else {
                        if (b.hasClass('navbar-affixed-top')) {
                            b.removeClass('navbar-affixed-top');
                        }
                        if (b.hasClass('navbar-affixed-bottom')) {
                            b.removeClass('navbar-affixed-bottom');
                        }
                    }
                }); // end watch(affixed)

                //=== Methods ===//

                $scope.noop = function() {
                    angular.noop();
                }; // end noop

                $scope.navAction = function(action) {
                    $scope.navfn({
                        'action': action
                    });
                }; // end navAction

                /**
                 * Have Branding
                 * Checks to see if the "brand" attribute was passed, if not use the default
                 * @result  string
                 */
                $scope.haveBranding = function() {
                    return (angular.isDefined($attrs.brand)) ? $scope.brand : $scope.defaults.brand;
                };

                /**
                 * Has Dropdown Menu
                 * Check to see if navbar item should have a dropdown menu
                 * @param  object  menu
                 * @result  boolean
                 */
                $scope.hasDropdownMenu = function(menu) {
                    return (angular.isDefined(menu.menu) && angular.isArray(menu.menu) && menu.menu.length > 0);
                }; // end hasDropdownMenu

                /**
                 * Is Divider
                 * Check to see if dropdown menu item is to be a menu divider.
                 * @param  object  item
                 * @result  boolean
                 */
                $scope.isDivider = function(item) {
                    return (angular.isDefined(item.divider) && angular.equals(item.divider, true));
                }; // end isDivider

                // Get Wordpress menu
                WPB3Menu.get({
                    id: $scope.menuname
                }).$promise.then(function(menuItems) {

                    var items = menuItems.menu.items;
                    $scope.menusFlat = [];

                    if (items) {

                        // Transform Wordpress menu array into useable form
                        // angular.forEach(treeMenu, function(menuItem) { //, key) {
                        angular.forEach(items, function(menuItem) { //, key) {

                            var item = {};

                            item.title = menuItem.title;

                            item.link = myApp.cleanUrl(menuItem.link);

                            if (menuItem.attr_title && menuItem.attr_title !== '') {
                                item.link += '?' + menuItem.attr_title;
                            }

                            // Menu item ID
                            item.ID = menuItem.ID;

                            // Post/Page ID
                            item.objectId = menuItem.object;

                            if (menuItem.parent !== 0) {
                                item.parent = menuItem.parent;
                            } else {
                                item.parent = null;
                            }

                            $scope.menusFlat.push(item);

                        });

                        // Tree
                        $scope.menus = treeify($scope.menusFlat, 'ID', 'parent', 'menu');

                    }

                });

            }

        };
    }]);

    /**
     * @ngdoc service
     * @name net.bitflower.WPB3Menu
     * @description
     * # WPB3Menu
     */
    app.service('WPB3Menu', ['$resource', 'myApp', function($resource, myApp) {

        function noCache() {
            return '?_=' + Math.random();
        }

        return $resource(myApp.apiUrl + 'b3_menus/:id' + noCache(), {
            id: '@id'
        }, {
            'get': {
                method: 'GET',
                cache: true
            },
            'query': {
                method: 'GET',
                isArray: true,
                cache: true
            }
        });

    }]);

})();

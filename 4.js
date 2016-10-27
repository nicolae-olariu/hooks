(function() {
  'use strict';

  angular
    .module('meineke')
    .directive('meinekeFullslate', fullslate);

  fullslate.$inject = ['$rootScope', 'DataService', 'RestService', '$log', '$http',
    '$templateCache', '$parse', '$compile', '$timeout', '$cookies', '$localStorage',
    'FS_RESPONSE_HANDLER'
  ];

  function fullslate($rootScope, DataService, RestService, $log, $http, $templateCache, $parse,
    $compile, $timeout, $cookies, $localStorage, FS_RESPONSE_HANDLER) {
    function link(scope, elem, attrs) {
      /*------------------------------------------------------------------
       Methods
       ------------------------------------------------------------------*/

      var fsInitConfig = {
        dynamicallyLoadFSTemplate: function() {

          scope.$watch(attrs.baseUrl, function(value) {
            if (value) {
              $rootScope.replaceWithTemplate(value + 'views/fullslate/fullslate.html',
                elem, scope);
            }
          });
        },
        bindShowFSEvent: function() {
          // Listens for 'fs.show' event and shows up the FS widget when this event gets caught.
          $('html')
            .on('fs.show', scope.showWidget);
        },
        bindWindowResizeFSEvent: function() {
          $(window)
            .on('resize.fs', $rootScope.calculateBodyHeight);
        },
        calculateBodyHeight: function(callback) {
          var bodyHeight = $('.fs-content')
            .outerHeight(true) - $('.fs-header')
            .outerHeight(true) - $('.fs-footer')
            .outerHeight(true);
          $('.fs-scroll')
            .height(bodyHeight);
          if (callback && typeof callback === 'function') {
            callback();
          }
        },
        isMobile: function() {
          return angular.element(window)
            .width() < 768;
        }
      };

      /*------------------------------------------------------------------
      Init
      ------------------------------------------------------------------*/

      $rootScope.calculateBodyHeight = fsInitConfig.calculateBodyHeight;
      $rootScope.isMobile = fsInitConfig.isMobile();
      $rootScope.storeId = attrs.storeId;

      //Init variables for load-testimonials Directive
      $rootScope.testimonials = [];
      $rootScope.testimonialsLimit = 0;

      DataService.userId.set(attrs.userId);
      DataService.storeId.set(attrs.storeId);

      fsInitConfig.dynamicallyLoadFSTemplate();
      fsInitConfig.bindShowFSEvent();
      fsInitConfig.bindWindowResizeFSEvent();
    }

    function controller($scope) {

      /*------------------------------------------------------------------
      Properties
      ------------------------------------------------------------------*/

      $scope.settings = {
        minStep: 1,
        currentStep: 0,
        totalSteps: 4,
        loaded: false
      };

      $scope.semCam = $cookies.get('trackingCall');

      $scope.fsInnerTop = 0;

      /*------------------------------------------------------------------
      Methods
      ------------------------------------------------------------------*/

      $scope.goToStep = function(stepIndex) {
        $scope.settings.currentStep = stepIndex;
        $scope.selectedServices = DataService.services.getSelected();

        if (stepIndex === 1 || stepIndex === 2) {
          $scope.selectedDay = null;
          $scope.selectedHour = null;
          DataService.selectedOpening.clear();
        } else {
          $scope.selectedDay = DataService.selectedOpening.getDate()
            .day;
          $scope.selectedHour = DataService.selectedOpening.getDate()
            .hour;
        }

        if (stepIndex !== 3) {
          $scope.loading = true;
        }
      };

      $scope.showWidget = function(e, config) {
        // Make sure to delete local storage details for user info.
        delete $localStorage.userInfo;

        $scope.loading = true;
        var step = 1;

        if (config) {
          DataService.selectedIds.set(config.serviceIds);
          $scope.liveServices = config.serviceIds;
          step = config.step || 1;
          if (config.date && typeof config.date !== 'undefined') {
            var date = config.date,
              fields = date.split('/'),
              year = fields[2],
              day = fields[1],
              month = fields[0];
            $rootScope.dateToShow = year + '-' + month + '-' + day;
          }

          if (config.day && config.day !== 'undefined') {
            $rootScope.formattedDate = config.day;
          }

          if (config.storeId && typeof config.storeId !== 'undefined') {
            if (DataService.storeId.get() !== config.storeId) {
              DataService.storeId.set(config.storeId);
            }
          } else if (typeof DataService.storeId.get() === 'undefined') {
            DataService.storeId.set($cookies.get('my_meineke'));
          }
        }
        $scope.goToStep(step);

        $scope.$apply();

        $('.popover')
          .popover('toggle');
        $('.fs-widget')
          .fadeIn();
      };

      $scope.closeWidget = function() {
        var closeFS = function() {
          $scope.settings.currentStep = 0;

          $scope.selectedServices = null;
          $scope.selectedDay = null;
          $scope.selectedHour = null;
          $rootScope.showSelectedDate = null;
          $rootScope.dateToShow = undefined;
          $rootScope.formattedDate = undefined;
          $('.fs-widget')
            .fadeOut(400, function() {
              // Clear selected services and dates if user closes the FS widget.
              DataService.services.clearSelected();
              // Clear all services.
              DataService.services.clear();
              DataService.selectedOpening.clear();

              // Clear selected service ids.
              DataService.selectedIds.clear();
              window.serviceIds = [];
              window.previousParentIndex = undefined;

              // Clear selected coupons if user closes the FS widget.
              DataService.coupons.clear();

              // Uncheck all service checkboxes.
              $('.fs-select-service input[type=checkbox]')
                .prop('checked', false);

              // Remove specific selected classes from label icon fonts.
              $('.fs-select-service label.checked.icon-check')
                .removeClass('checked icon-check');

              // Uncheck all coupon checkboxes.
              $('input[id^=fs-coupon-chk-]')
                .prop('checked', false);

              // Disable all buttons which trigger FS step 2.
              $(
                  '.schedule-app-date-mob [data-open-fs-step], .popover [data-open-fs-step], #schedule-app-carousel [data-open-fs-step]'
                )
                .attr('disabled', true);

              // Delete stored data for user info step 3.
              delete $localStorage.userInfo;

              // Delete data attributes from modal
              $('.attr-data-date')
                .attr('data-date', "")
                .attr('data-day', "");

              // Reset body height
              angular.element('body')
                .removeClass('body-overflow')
                .css('height', 'auto');

              $('html, body')
                .animate({
                  scrollTop: $rootScope.fsInnerTop
                }, 500);
            });
        };

        if ($rootScope.isMobile) {
          $('body')
            .removeClass('fs-open');

          $timeout(function() {
            // Remove scheduler backdrop when closing FZ fullslate popover
            $('.scheduler-backdrop')
              .removeClass('active');

            // Reset styling for FS inner container.
            $('.fs-inner')
              .css({
                top: 'auto',
                height: 'auto'
              });

            // Closes FS.
            closeFS();
          }, 600); // off the canvas animation duration
        } else {
          closeFS();
        }
      };

      $scope.goToPreviousStep = function() {
        $scope.goToStep($scope.settings.currentStep > $scope.settings.minStep ? $scope.settings
          .currentStep - 1 : $scope.settings.minStep);
      };

      $scope.goToNextStep = function() {
        $scope.$broadcast('fs.gotonextstep');

        $scope.goToStep($scope.settings.currentStep < $scope.settings.totalSteps ? $scope.settings
          .currentStep + 1 : $scope.settings.totalSteps);
      };

      $scope.getStoreInfo = function() {
        RestService
          .store
          .get({
            id: DataService.storeId.get()
          })
          .$promise
          .then(function(response) {
            if (response.$httpStatus === 200) {
              if (response.data.message && response.data.message.length) {
                DataService.storeInfo.set(response.data.message[0]);

                $scope.storeInfo = DataService.storeInfo.get();
                $scope.watcher = true;
              }
            }
          })
          .catch(function(error) {
            $log.error(error);
          });
      };
      $scope.bookingIsNeeded = function() {
        var dataID = DataService.storeId.get();
        return FS_RESPONSE_HANDLER.isEmailConfRequired(dataID);
      };
      /*------------------------------------------------------------------
      Watchers
      ------------------------------------------------------------------*/

      $scope.$watch(
        function() {
          return $rootScope.loaded;
        },
        function(newVal, oldVal) {
          if (newVal === true) {
            $scope.loading = false;
            $rootScope.loaded = false;
          }
        });

      $scope.$watch(
        function() {
          return angular.toJson([$scope.liveServices, $scope.loading, $rootScope.clickedService,
            $rootScope.clickedHour
          ]);
        },
        function(newVals, oldVals) {
          if (typeof newVals !== 'undefined' && newVals !== oldVals) {
            var watcherGroup = angular.fromJson(newVals);
            if (watcherGroup[1] === false || watcherGroup[2] === false || watcherGroup[3] ===
              false) {
              $scope.selectedServices = DataService.services.getSelected();
              if ($scope.settings.currentStep !== 1) {
                $scope.selectedDay = DataService.selectedOpening.getDate()
                  .day;
                $scope.selectedHour = DataService.selectedOpening.getDate()
                  .hour;
              }
              $rootScope.clickedService = undefined;
              $rootScope.clickedHour = undefined;
            }
          }
        });

      $scope.$watch(
        function() {
          return angular.element('.fs-content')
            .height();
        },
        function(newVal, oldVal) {
          if (typeof newVal !== 'undefined' && newVal !== oldVal && angular.element('body')
            .hasClass('fs-open')) {
            angular.element('body')
              .css('height', newVal);
          }
        });

      $scope.$watch(
        function() {
          return $scope.settings.currentStep;
        },
        function(newVal, oldVal) {
          if (typeof newVal !== 'undefined' && newVal !== oldVal) {
            if (newVal === 2) {
              $('html, body')
                .scrollTop(0);
            }
          }
        });

      /*------------------------------------------------------------------
      Init
      ------------------------------------------------------------------*/
      $scope.$watch(
        function() {
          return DataService.storeId.get();
        },
        function(newVal, oldVal) {
          if (newVal) {
            $rootScope.storeId = newVal;
            $scope.getStoreInfo();
          }
        });
    };

    return {
      scope: {
        baseUrl: '=',
        userId: '=',
        storeId: '='
      },
      restrict: 'A',
      controller: ['$scope', controller],
      link: link
    };
  };
})();
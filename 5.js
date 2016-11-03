(function() {
  'use strict';

  angular
    .module('application')
    .controller('ProfitToolController', ProfitToolController);

  function ProfitToolController($log, ProfitService) {
    console.info('ProfitToolController');
    /**
     * Vars
     */
    var vm = this;
    vm.results = {};
    vm.userInfo = {};
    vm.profitToolStep = 1;
    vm.isCalculateInProgress = false;

    // functions
    vm.resetForm = resetForm;
    vm.submitForm = submitForm;
    vm.goToNextStep = goToNextStep;
    vm.goToPreviousStep = goToPreviousStep;
    /**
     * Private functions
     */

    function postCalculateData() {
      ProfitService.profit(vm.userInfo)
        .then(function(res) {
          vm.results = res.data;
          vm.isCalculateInProgress = false;
          vm.profitToolStep = 4;
        })
        .catch(function(err) {
          vm.isCalculateInProgress = false;
          $log.error(err);
        })
    }

    function checkIfFormIsValid(form) {
      var form = angular.element(form);
      form.validator('validate');
      return (!form.is('.ng-invalid'))
    }

    function resetObject(obj) {
      var resetedObject = {};
      angular.forEach(obj, function(value, key) {
        this[key] = '';
      }, resetedObject);
      return resetedObject;
    }

    /**
     * Public functions
     */

    function submitForm() {
      if (vm.profitToolStep < 3) {
        return false;
      }
      vm.isCalculateInProgress = true;
      postCalculateData();

    }

    function resetForm(event) {
      vm.profitToolStep = 1;
      vm.results = {};
      vm.userInfo = resetObject(vm.userInfo);
    }

    function goToNextStep(event) {
      if (!checkIfFormIsValid(event.currentTarget.form)) return
      vm.profitToolStep = Math.min(++vm.profitToolStep, 3)
    }

    function goToPreviousStep() {
      vm.profitToolStep = Math.max(1, --vm.profitToolStep)
    }
  }
})();
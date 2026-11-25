pipeline {
  agent { label 'docker-aws-kubectl' }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  environment {
    AWS_REGION = 'ap-south-1'
    ECR_REGISTRY = '000000000000.dkr.ecr.ap-south-1.amazonaws.com'
    ECR_BACKEND_REPOSITORY = 'onestep-backend'
    ECR_FRONTEND_REPOSITORY = 'onestep-frontend'
    K8S_NAMESPACE = 'onestep'
    IMAGE_TAG = "${BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Backend test') {
      steps {
        dir('backend') {
          sh 'npm install'
          sh 'npm test'
        }
      }
    }

    stage('Frontend build') {
      steps {
        dir('frontend') {
          sh 'npm install'
          sh 'npm run build'
        }
      }
    }

    stage('Build images') {
      steps {
        sh '''
          docker build -t ${ECR_REGISTRY}/${ECR_BACKEND_REPOSITORY}:${IMAGE_TAG} ./backend
          docker build -t ${ECR_REGISTRY}/${ECR_FRONTEND_REPOSITORY}:${IMAGE_TAG} ./frontend
        '''
      }
    }

    stage('Security scan') {
      steps {
        sh '''
          if command -v trivy >/dev/null 2>&1; then
            trivy image --exit-code 1 --severity HIGH,CRITICAL ${ECR_REGISTRY}/${ECR_BACKEND_REPOSITORY}:${IMAGE_TAG}
            trivy image --exit-code 1 --severity HIGH,CRITICAL ${ECR_REGISTRY}/${ECR_FRONTEND_REPOSITORY}:${IMAGE_TAG}
          else
            echo "WARNING: Trivy is not installed on this Jenkins agent; configure it before production use."
          fi
        '''
      }
    }

    stage('Push to ECR') {
      steps {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding',
          credentialsId: 'aws-credentials']]) {
          sh '''
            aws ecr get-login-password --region ${AWS_REGION} |
              docker login --username AWS --password-stdin ${ECR_REGISTRY}
            docker push ${ECR_REGISTRY}/${ECR_BACKEND_REPOSITORY}:${IMAGE_TAG}
            docker push ${ECR_REGISTRY}/${ECR_FRONTEND_REPOSITORY}:${IMAGE_TAG}
          '''
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig-onestep', variable: 'KUBECONFIG_FILE')]) {
          sh '''
            export KUBECONFIG=$KUBECONFIG_FILE
            kubectl apply -f k8s/namespace.yaml
            kubectl apply -f k8s/configmap.yaml
            kubectl apply -f k8s/serviceaccount.yaml
            kubectl -n ${K8S_NAMESPACE} set image deployment/onestep-backend backend=${ECR_REGISTRY}/${ECR_BACKEND_REPOSITORY}:${IMAGE_TAG} --ignore-not-found=true || true
            sed "s|IMAGE_PLACEHOLDER_BACKEND|${ECR_REGISTRY}/${ECR_BACKEND_REPOSITORY}:${IMAGE_TAG}|g; s|IMAGE_PLACEHOLDER_FRONTEND|${ECR_REGISTRY}/${ECR_FRONTEND_REPOSITORY}:${IMAGE_TAG}|g" k8s/backend-deployment.yaml > /tmp/backend-deployment.yaml
            sed "s|IMAGE_PLACEHOLDER_FRONTEND|${ECR_REGISTRY}/${ECR_FRONTEND_REPOSITORY}:${IMAGE_TAG}|g" k8s/frontend-deployment.yaml > /tmp/frontend-deployment.yaml
            kubectl apply -f /tmp/backend-deployment.yaml
            kubectl apply -f /tmp/frontend-deployment.yaml
            kubectl apply -f k8s/backend-service.yaml
            kubectl apply -f k8s/frontend-service.yaml
            kubectl apply -f k8s/backend-hpa.yaml
            kubectl apply -f k8s/frontend-hpa.yaml
            kubectl apply -f k8s/backend-pdb.yaml
            kubectl apply -f k8s/frontend-pdb.yaml
            kubectl apply -f k8s/ingress.yaml
            kubectl -n ${K8S_NAMESPACE} rollout status deployment/onestep-backend --timeout=180s
            kubectl -n ${K8S_NAMESPACE} rollout status deployment/onestep-frontend --timeout=180s
          '''
        }
      }
    }
  }

  post {
    always {
      sh 'docker image prune -f || true'
    }
    success { echo 'OneStep pipeline completed successfully.' }
    failure { echo 'Pipeline failed. Inspect stage logs before retrying.' }
  }
}
